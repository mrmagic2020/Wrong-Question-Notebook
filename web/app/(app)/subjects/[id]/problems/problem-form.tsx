'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import FileManager from '@/components/ui/file-manager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PROBLEM_TYPE_VALUES, type ProblemType } from '@/lib/schemas';
import { getProblemTypeDisplayName } from '@/lib/common-utils';
import { Textarea } from '@/components/ui/textarea';
import { VALIDATION_CONSTANTS } from '@/lib/constants';

type Tag = { id: string; name: string };

export default function ProblemForm({
  subjectId,
  availableTags = [],
  problem = null,
  onCancel = null,
  onProblemCreated = null,
  onProblemUpdated = null,
}: {
  subjectId: string;
  availableTags?: Tag[];
  problem?: any | null;
  onCancel?: (() => void) | null;
  onProblemCreated?: ((newProblem: any) => void) | null;
  onProblemUpdated?: ((updatedProblem: any) => void) | null;
}) {
  const router = useRouter();
  const isEditMode = !!problem;

  // Use provided tags or fallback to client-side fetching
  const [tags, setTags] = useState<Tag[]>(availableTags);
  useEffect(() => {
    if (availableTags.length > 0) {
      setTags(availableTags);
    } else {
      // Fallback to client-side fetching if no tags provided
      fetch(`/api/tags?subject_id=${subjectId}`)
        .then(r => r.json())
        .then(j => setTags(j.data ?? []))
        .catch(() => {});
    }
  }, [availableTags, subjectId]);

  // Tag picker - initialize with problem's existing tags if available
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => {
    // If we have problem data with tags, use those; otherwise start empty
    if (problem && problem.tags) {
      return problem.tags.map((tag: any) => tag.id);
    }
    return [];
  });

  function toggleTag(id: string) {
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  // Form expansion state (only for create mode)
  const [isExpanded, setIsExpanded] = useState(isEditMode);

  const [title, setTitle] = useState(problem?.title || '');
  const [titleFocus, setTitleFocus] = useState(false);
  const [content, setContent] = useState(problem?.content || '');
  const [contentFocus, setContentFocus] = useState(false);
  const [problemType, setProblemType] = useState<ProblemType>(
    problem?.problem_type || 'short'
  );
  const [status, setStatus] = useState<'wrong' | 'needs_review' | 'mastered'>(
    problem?.status || 'needs_review'
  );
  const [autoMark, setAutoMark] = useState(problem?.auto_mark || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-update auto-mark based on problem type (only for new problems)
  useEffect(() => {
    if (!isEditMode) {
      switch (problemType) {
        case 'mcq':
          setAutoMark(true);
          break;
        case 'short':
          setAutoMark(false);
          break;
        case 'extended':
          setAutoMark(false);
          break;
      }
    }
  }, [problemType, isEditMode]);

  // Auto-mark behavior based on problem type
  const autoMarkValue = useMemo(() => {
    switch (problemType) {
      case 'mcq':
        return autoMark;
      case 'short':
        return autoMark;
      case 'extended':
        return false; // Always false for extended response
      default:
        return false;
    }
  }, [problemType, autoMark]);

  const isAutoMarkDisabled = problemType === 'extended';

  // Correct answer inputs
  const [mcqChoice, setMcqChoice] = useState(
    problem?.correct_answer?.type === 'mcq'
      ? problem.correct_answer.choice
      : typeof problem?.correct_answer === 'string'
        ? problem.correct_answer
        : ''
  );
  const [shortText, setShortText] = useState(
    problem?.correct_answer?.type === 'short'
      ? problem.correct_answer.text
      : typeof problem?.correct_answer === 'string'
        ? problem.correct_answer
        : ''
  );

  // Assets
  const [problemAssets, setProblemAssets] = useState<
    Array<{ path: string; name: string }>
  >(
    problem?.assets?.map((asset: any) => ({
      path: asset.path,
      name: asset.path.split('/').pop() || '',
    })) || []
  );
  const [solutionText, setSolutionText] = useState(
    problem?.solution_text || ''
  );
  const [solutionTextFocus, setSolutionTextFocus] = useState(false);
  const [solutionAssets, setSolutionAssets] = useState<
    Array<{ path: string; name: string }>
  >(
    problem?.solution_assets?.map((asset: any) => ({
      path: asset.path,
      name: asset.path.split('/').pop() || '',
    })) || []
  );

  const correctAnswer = useMemo(() => {
    switch (problemType) {
      case 'mcq':
        return mcqChoice;
      case 'short':
        return shortText;
      case 'extended':
        return undefined;
    }
  }, [problemType, mcqChoice, shortText]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a problem title');
      return;
    }

    setIsSubmitting(true);

    try {
      const assets = problemAssets.map(asset => ({ path: asset.path }));
      const solution_assets = solutionAssets.map(asset => ({
        path: asset.path,
      }));

      // Sanitize input data
      const sanitizedTitle = title
        .trim()
        .substring(0, VALIDATION_CONSTANTS.STRING_LIMITS.TITLE_MAX);
      const sanitizedContent = content
        ? content.substring(0, VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX)
        : '';
      const sanitizedSolutionText = solutionText
        ? solutionText.substring(
            0,
            VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX
          )
        : '';
      const sanitizedCorrectAnswer = correctAnswer
        ? correctAnswer.substring(
            0,
            VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX
          )
        : '';

      const payload = {
        title: sanitizedTitle,
        content: sanitizedContent,
        problem_type: problemType,
        correct_answer:
          problemType === 'extended' ? '' : sanitizedCorrectAnswer,
        auto_mark: autoMarkValue,
        status,
        assets,
        solution_text: sanitizedSolutionText,
        solution_assets,
        tag_ids: selectedTagIds, // Always send the array, even if empty
      };

      // Add subject_id for create operations
      if (!isEditMode) {
        (payload as any).subject_id = subjectId;
      }

      const url = isEditMode ? `/api/problems/${problem.id}` : '/api/problems';
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          j?.error ?? `Failed to ${isEditMode ? 'update' : 'create'} problem`
        );
      }

      toast.success(
        isEditMode
          ? 'Problem updated successfully'
          : 'Problem created successfully'
      );

      // Clean up staging files after successful problem creation/update
      try {
        await fetch(`/api/uploads/staging?stagingId=${stagingId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn(
          'Failed to cleanup staging files after successful submission:',
          error
        );
      }

      if (isEditMode) {
        // In edit mode, notify parent component with updated problem data
        if (onProblemUpdated && j.data) {
          onProblemUpdated(j.data);
        }
        // Close the form
        if (onCancel) {
          onCancel();
        }
      } else {
        // For create mode, notify parent component with new problem data
        if (onProblemCreated && j.data) {
          onProblemCreated(j.data);
        }

        // Reset some fields for create mode
        setTitle('');
        setContent('');
        setProblemAssets([]);
        setSolutionText('');
        setSolutionAssets([]);
        setShortText('');
        setMcqChoice('');
        setSelectedTagIds([]);
        setProblemType('short');
        setStatus('needs_review');
        setAutoMark(false);
        setIsExpanded(false);
      }

      router.refresh();
    } catch (error: any) {
      toast.error(
        error.message || `Failed to ${isEditMode ? 'update' : 'create'} problem`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const [stagingId] = useState(
    () => `${Date.now()}-${globalThis.crypto?.randomUUID?.() ?? 'rnd'}`
  );

  // Clean up staging folder when component unmounts or user leaves page
  useEffect(() => {
    const cleanupStaging = async () => {
      try {
        // Use sendBeacon for more reliable cleanup on page unload
        if (navigator.sendBeacon) {
          const formData = new FormData();
          formData.append('stagingId', stagingId);
          navigator.sendBeacon('/api/uploads/staging', formData);
        } else {
          // Fallback to fetch with keepalive
          await fetch(`/api/uploads/staging?stagingId=${stagingId}`, {
            method: 'DELETE',
            keepalive: true,
          });
        }
      } catch (error) {
        console.warn('Failed to cleanup staging files:', error);
      }
    };

    // Cleanup on page unload/refresh/close (when user truly leaves)
    const handleBeforeUnload = () => {
      cleanupStaging();
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Return cleanup function for component unmount (navigation within app)
    return () => {
      cleanupStaging();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [stagingId]);

  // If not expanded (create mode only), show just the expand button
  if (!isExpanded && !isEditMode) {
    return (
      <div className="form-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(true)}
          className="flex-1 border-dashed text-muted-foreground hover:border-primary/50 hover:text-foreground justify-start"
        >
          + Add a new problem
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form-container">
      {isEditMode && (
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="heading-xs">Edit Problem</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onCancel?.()}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* title */}
      <div className="form-row">
        <label className="form-label">Title</label>
        <div className="flex-1 relative">
          <Input
            type="text"
            className="form-input w-full"
            placeholder="Short descriptive title for the problem"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={VALIDATION_CONSTANTS.STRING_LIMITS.TITLE_MAX}
            required
            onFocus={() => setTitleFocus(true)}
            onBlur={() => setTitleFocus(false)}
          />
          {titleFocus && (
            // title length inside input, bottom-right
            <span
              className="absolute bottom-1.5 right-3 text-xs text-muted-foreground pointer-events-none bg-background px-1"
              style={{ lineHeight: 1 }}
            >
              {title.length}/{VALIDATION_CONSTANTS.STRING_LIMITS.TITLE_MAX}
            </span>
          )}
        </div>
      </div>

      {/* content */}
      <div className="form-row-start">
        <label className="form-label pt-2">Content</label>
        <div className="flex-1 relative">
          <Textarea
            className="form-textarea"
            placeholder="Type the problem text (Markdown/LaTeX supported) - Optional"
            value={content}
            maxLength={VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX}
            onFocus={() => setContentFocus(true)}
            onBlur={() => setContentFocus(false)}
            onChange={e => setContent(e.target.value)}
          />
          {contentFocus && (
            <span
              className="absolute bottom-1.5 right-3 text-xs text-muted-foreground pointer-events-none bg-background px-1"
              style={{ lineHeight: 1 }}
            >
              {content.length}/
              {VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX}
            </span>
          )}
        </div>
      </div>

      {/* problem assets */}
      <div className="form-row-start">
        <label className="form-label pt-2">Problem assets</label>
        <div className="flex-1">
          <FileManager
            role="problem"
            stagingId={stagingId}
            initialFiles={problemAssets}
            onFilesChange={setProblemAssets}
          />
        </div>
      </div>

      {/* type + auto-mark + status */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="form-label-top">Type</label>
          <Select
            value={problemType}
            onValueChange={value => setProblemType(value as ProblemType)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROBLEM_TYPE_VALUES.map(type => (
                <SelectItem key={type} value={type}>
                  {getProblemTypeDisplayName(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={autoMarkValue}
            disabled={isAutoMarkDisabled}
            onChange={e => setAutoMark(e.target.checked)}
            className="form-checkbox"
          />
          Auto-mark during revision
          {isAutoMarkDisabled && (
            <span className="text-body-sm text-muted-foreground">
              (not available for extended response)
            </span>
          )}
        </label>

        <div className="flex items-center gap-2">
          <label className="form-label-top">Status</label>
          <Select
            value={status}
            onValueChange={value => setStatus(value as any)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="needs_review">
                <StatusBadge status="needs_review" />
              </SelectItem>
              <SelectItem value="wrong">
                <StatusBadge status="wrong" />
              </SelectItem>
              <SelectItem value="mastered">
                <StatusBadge status="mastered" />
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* correct answer (conditional) */}
      {problemType === 'mcq' && (
        <div className="form-row">
          <label className="form-label">Correct choice</label>
          <Input
            className="form-input w-32"
            placeholder="e.g. A, B, α, etc."
            value={mcqChoice}
            maxLength={VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX}
            onChange={e => setMcqChoice(e.target.value)}
          />
        </div>
      )}
      {problemType === 'short' && (
        <div className="form-row">
          <label className="form-label">Correct text</label>
          <Input
            className="form-input"
            placeholder="Short expected answer"
            value={shortText}
            maxLength={VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX}
            onChange={e => setShortText(e.target.value)}
          />
        </div>
      )}

      {/* solution text + assets */}
      <div className="form-row-start">
        <label className="form-label pt-2">Solution (text)</label>
        <div className="flex-1 relative">
          <Textarea
            className="form-textarea"
            placeholder="Optional: typed solution (Markdown/LaTeX)"
            value={solutionText}
            maxLength={VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX}
            onChange={e => setSolutionText(e.target.value)}
            onFocus={() => setSolutionTextFocus(true)}
            onBlur={() => setSolutionTextFocus(false)}
          />
          {solutionTextFocus && (
            <span
              className="absolute bottom-1.5 right-3 text-xs text-muted-foreground pointer-events-none bg-background px-1"
              style={{ lineHeight: 1 }}
            >
              {solutionText.length}/
              {VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX}
            </span>
          )}
        </div>
      </div>
      <div className="form-row-start">
        <label className="form-label pt-2">Solution assets</label>
        <div className="flex-1">
          <FileManager
            role="solution"
            stagingId={stagingId}
            initialFiles={solutionAssets}
            onFilesChange={setSolutionAssets}
          />
        </div>
      </div>

      {/* tag picker */}
      <div className="form-row-start">
        <label className="form-label pt-1">Tags</label>
        <div className="flex flex-wrap gap-3">
          {tags.length ? (
            tags.map(t => (
              <label
                key={t.id}
                className="flex items-center gap-2 text-foreground"
              >
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(t.id)}
                  onChange={() => toggleTag(t.id)}
                  className="form-checkbox"
                />
                <span>{t.name}</span>
              </label>
            ))
          ) : (
            <p className="text-body-sm text-muted-foreground">No tags yet.</p>
          )}
        </div>
      </div>

      <div className="form-actions">
        <Button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting && <div className="loading-spinner" />}
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Adding...'
            : isEditMode
              ? 'Update problem'
              : 'Add problem'}
        </Button>
        {!isEditMode && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExpanded(false)}
            disabled={isSubmitting}
            className="btn-outline"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
