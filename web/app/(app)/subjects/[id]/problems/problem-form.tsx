'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import FileManager from '@/components/ui/file-manager';
import { PROBLEM_TYPE_VALUES, type ProblemType } from '@/lib/schemas';
import { getProblemTypeDisplayName } from '@/lib/display-utils';

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
  const [content, setContent] = useState(problem?.content || '');
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
      const sanitizedTitle = title.trim().substring(0, 30); // Limit title length
      const sanitizedContent = content ? content.substring(0, 1000) : undefined; // Limit content length
      const sanitizedSolutionText = solutionText
        ? solutionText.substring(0, 1000)
        : undefined; // Limit solution length

      const payload = {
        title: sanitizedTitle,
        content: sanitizedContent,
        problem_type: problemType,
        correct_answer: problemType === 'extended' ? undefined : correctAnswer,
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
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex-1 rounded-md border border-dashed border-border px-4 py-3 text-left text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
        >
          + Add a new problem
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isEditMode && (
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="font-medium text-foreground">Edit Problem</h3>
          <button
            type="button"
            onClick={() => onCancel?.()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* title */}
      <div className="flex items-center gap-3">
        <label className="w-32 text-sm text-muted-foreground">Title</label>
        <input
          type="text"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          placeholder="Short descriptive title for the problem"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={200}
          required
        />
      </div>

      {/* content */}
      <div className="flex items-start gap-3">
        <label className="w-32 text-sm text-muted-foreground pt-2">
          Content
        </label>
        <textarea
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 h-28 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          placeholder="Type the problem text (Markdown/LaTeX supported) - Optional"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>

      {/* problem assets */}
      <div className="flex items-start gap-3">
        <label className="w-32 text-sm text-muted-foreground pt-2">
          Problem assets
        </label>
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
          <label className="text-sm text-muted-foreground">Type</label>
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={problemType}
            onChange={e => setProblemType(e.target.value as ProblemType)}
          >
            {PROBLEM_TYPE_VALUES.map(type => (
              <option key={type} value={type}>
                {getProblemTypeDisplayName(type)}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={autoMarkValue}
            disabled={isAutoMarkDisabled}
            onChange={e => setAutoMark(e.target.checked)}
            className="rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          Auto-mark during revision
          {isAutoMarkDisabled && (
            <span className="text-xs text-muted-foreground">
              (not available for extended response)
            </span>
          )}
        </label>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Status</label>
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={status}
            onChange={e => setStatus(e.target.value as any)}
          >
            <option value="needs_review">Needs review</option>
            <option value="wrong">Wrong</option>
            <option value="mastered">Mastered</option>
          </select>
        </div>
      </div>

      {/* correct answer (conditional) */}
      {problemType === 'mcq' && (
        <div className="flex items-center gap-3">
          <label className="w-32 text-sm text-muted-foreground">
            Correct choice
          </label>
          <input
            className="w-32 rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="e.g. A, B, α, etc."
            value={mcqChoice}
            onChange={e => setMcqChoice(e.target.value)}
          />
        </div>
      )}
      {problemType === 'short' && (
        <div className="flex items-center gap-3">
          <label className="w-32 text-sm text-muted-foreground">
            Correct text
          </label>
          <input
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            placeholder="Short expected answer"
            value={shortText}
            onChange={e => setShortText(e.target.value)}
          />
        </div>
      )}

      {/* solution text + assets */}
      <div className="flex items-start gap-3">
        <label className="w-32 text-sm text-muted-foreground pt-2">
          Solution (text)
        </label>
        <textarea
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 h-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          placeholder="Optional: typed solution (Markdown/LaTeX)"
          value={solutionText}
          onChange={e => setSolutionText(e.target.value)}
        />
      </div>
      <div className="flex items-start gap-3">
        <label className="w-32 text-sm text-muted-foreground pt-2">
          Solution assets
        </label>
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
      <div className="flex items-start gap-3">
        <label className="w-32 text-sm text-muted-foreground pt-1">Tags</label>
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
                  className="rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <span>{t.name}</span>
              </label>
            ))
          ) : (
            <div className="text-muted-foreground">No tags yet.</div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && (
            <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          )}
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Adding...'
            : isEditMode
              ? 'Update problem'
              : 'Add problem'}
        </button>
        {!isEditMode && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            disabled={isSubmitting}
            className="rounded-md border border-border bg-background px-4 py-2 text-foreground hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
