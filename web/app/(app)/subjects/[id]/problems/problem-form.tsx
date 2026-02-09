'use client';

import { useRouter } from 'next/navigation';
import {
  FormEvent,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
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
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { MCQChoiceEditor } from '@/components/ui/mcq-choice-editor';
import {
  ShortAnswerConfig,
  type ShortAnswerConfigValue,
} from '@/components/ui/short-answer-config';
import { VALIDATION_CONSTANTS, ANSWER_CONFIG_CONSTANTS } from '@/lib/constants';
import { Spinner } from '@/components/ui/spinner';
import {
  Tag,
  ProblemFormProps,
  MCQChoice,
  AnswerConfig,
  MCQAnswerConfig,
  ShortAnswerTextConfig,
  ShortAnswerNumericConfig,
} from '@/lib/types';
import { Editor } from '@tiptap/react';

export default function ProblemForm({
  subjectId,
  availableTags = [],
  problem = null,
  onCancel = null,
  onProblemCreated = null,
  onProblemUpdated = null,
}: ProblemFormProps) {
  const router = useRouter();
  const isEditMode = !!problem;

  // Refs for the rich text editors
  const contentEditorRef = useRef<Editor>(null);
  const solutionEditorRef = useRef<Editor>(null);

  // Helper function to transform SimpleTag to Tag
  const transformSimpleTagsToTags = useCallback(
    (simpleTags: typeof availableTags): Tag[] => {
      return (
        simpleTags?.map(tag => ({
          ...tag,
          subject_id: subjectId,
          created_at: new Date().toISOString(),
        })) || []
      );
    },
    [subjectId]
  );

  // Use provided tags or fallback to client-side fetching
  const [tags, setTags] = useState<Tag[]>(
    transformSimpleTagsToTags(availableTags)
  );
  useEffect(() => {
    if (availableTags && availableTags.length > 0) {
      setTags(transformSimpleTagsToTags(availableTags));
    } else {
      // Fallback to client-side fetching if no tags provided
      fetch(`/api/tags?subject_id=${subjectId}`)
        .then(r => r.json())
        .then(j => setTags(j.data ?? []))
        .catch(() => {});
    }
  }, [availableTags, subjectId, transformSimpleTagsToTags]);

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

  // Image insertion callbacks
  const handleInsertProblemImage = useCallback((path: string, name: string) => {
    if (!contentEditorRef.current) {
      toast.error('Editor not ready');
      return;
    }

    const imageUrl = `/api/files/${encodeURIComponent(path)}`;
    contentEditorRef.current
      .chain()
      .focus()
      .setResizableImage({
        src: imageUrl,
        alt: name,
      })
      .run();

    toast.success('Image inserted into problem content');
  }, []);

  const handleInsertSolutionImage = useCallback(
    (path: string, name: string) => {
      if (!solutionEditorRef.current) {
        toast.error('Editor not ready');
        return;
      }

      const imageUrl = `/api/files/${encodeURIComponent(path)}`;
      solutionEditorRef.current
        .chain()
        .focus()
        .setResizableImage({
          src: imageUrl,
          alt: name,
        })
        .run();

      toast.success('Image inserted into solution');
    },
    []
  );

  // Form expansion state (only for create mode)
  const [isExpanded, setIsExpanded] = useState(isEditMode);

  const [title, setTitle] = useState(problem?.title || '');
  const [titleFocus, setTitleFocus] = useState(false);
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

  // Correct answer inputs (legacy)
  const [mcqChoice, setMcqChoice] = useState(
    typeof problem?.correct_answer === 'string' ? problem.correct_answer : ''
  );
  const [shortText, setShortText] = useState(
    typeof problem?.correct_answer === 'string' ? problem.correct_answer : ''
  );

  // Enhanced answer config state
  const [mcqChoices, setMcqChoices] = useState<MCQChoice[]>(() => {
    const config = problem?.answer_config;
    if (config && config.type === 'mcq') {
      return (config as MCQAnswerConfig).choices;
    }
    return ANSWER_CONFIG_CONSTANTS.MCQ.DEFAULT_CHOICES.map(id => ({
      id,
      text: '',
    }));
  });
  const [mcqCorrectChoiceId, setMcqCorrectChoiceId] = useState(() => {
    const config = problem?.answer_config;
    if (config && config.type === 'mcq') {
      return (config as MCQAnswerConfig).correct_choice_id;
    }
    return '';
  });
  const [shortAnswerConfig, setShortAnswerConfig] =
    useState<ShortAnswerConfigValue>(() => {
      const config = problem?.answer_config;
      if (config && config.type === 'short') {
        if ((config as ShortAnswerTextConfig).mode === 'text') {
          return {
            mode: 'text' as const,
            acceptable_answers: (config as ShortAnswerTextConfig)
              .acceptable_answers,
          };
        }
        if ((config as ShortAnswerNumericConfig).mode === 'numeric') {
          const nc = (config as ShortAnswerNumericConfig).numeric_config;
          return {
            mode: 'numeric' as const,
            numeric_config: {
              correct_value: nc.correct_value,
              tolerance: nc.tolerance,
              unit: nc.unit,
            },
          };
        }
      }
      return { mode: 'text' as const, acceptable_answers: [] };
    });
  // Track whether user is using enhanced mode
  const [useEnhancedMcq, setUseEnhancedMcq] = useState(() => {
    // For existing problems with MCQ config, use it
    if (problem?.answer_config?.type === 'mcq') return true;
    // For new problems, default to true
    if (!isEditMode) return true;
    return false;
  });
  const [useEnhancedShort, setUseEnhancedShort] = useState(
    !!(problem?.answer_config?.type === 'short')
  );

  // Auto-enable enhanced mode when problem type changes (only for new problems)
  useEffect(() => {
    if (!isEditMode) {
      if (problemType === 'mcq') {
        setUseEnhancedMcq(true);
      }
    }
  }, [problemType, isEditMode]);

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
        if (useEnhancedMcq && mcqCorrectChoiceId) {
          return mcqCorrectChoiceId;
        }
        return mcqChoice;
      case 'short':
        if (useEnhancedShort && shortAnswerConfig.mode === 'text') {
          return shortAnswerConfig.acceptable_answers[0] || '';
        }
        if (
          useEnhancedShort &&
          shortAnswerConfig.mode === 'numeric' &&
          shortAnswerConfig.numeric_config.correct_value !== ''
        ) {
          return String(shortAnswerConfig.numeric_config.correct_value);
        }
        return shortText;
      case 'extended':
        return undefined;
    }
  }, [
    problemType,
    mcqChoice,
    shortText,
    useEnhancedMcq,
    useEnhancedShort,
    mcqCorrectChoiceId,
    shortAnswerConfig,
  ]);

  // Build answer_config for submission
  const answerConfig = useMemo((): AnswerConfig | null => {
    if (problemType === 'mcq' && useEnhancedMcq) {
      if (!mcqCorrectChoiceId) return null;
      return {
        type: 'mcq',
        choices: mcqChoices,
        correct_choice_id: mcqCorrectChoiceId,
      };
    }
    if (problemType === 'short' && useEnhancedShort) {
      if (shortAnswerConfig.mode === 'text') {
        if (shortAnswerConfig.acceptable_answers.length === 0) return null;
        return {
          type: 'short',
          mode: 'text',
          acceptable_answers: shortAnswerConfig.acceptable_answers,
        };
      }
      if (shortAnswerConfig.mode === 'numeric') {
        const nc = shortAnswerConfig.numeric_config;
        if (nc.correct_value === '' || nc.tolerance === '') return null;
        return {
          type: 'short',
          mode: 'numeric',
          numeric_config: {
            correct_value: Number(nc.correct_value),
            tolerance: Number(nc.tolerance),
            unit: nc.unit || undefined,
          },
        };
      }
    }
    return null;
  }, [
    problemType,
    useEnhancedMcq,
    useEnhancedShort,
    mcqChoices,
    mcqCorrectChoiceId,
    shortAnswerConfig,
  ]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a problem title');
      return;
    }

    // Validate enhanced answer config
    if (problemType === 'mcq' && useEnhancedMcq && !mcqCorrectChoiceId) {
      toast.error('Please select the correct answer choice');
      return;
    }
    if (problemType === 'short' && useEnhancedShort) {
      if (
        shortAnswerConfig.mode === 'text' &&
        shortAnswerConfig.acceptable_answers.length === 0
      ) {
        toast.error('Please add at least one acceptable answer');
        return;
      }
      if (shortAnswerConfig.mode === 'numeric') {
        const nc = shortAnswerConfig.numeric_config;
        if (nc.correct_value === '' || nc.tolerance === '') {
          toast.error('Please fill in the correct value and tolerance');
          return;
        }
      }
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

      const payload: Record<string, any> = {
        title: sanitizedTitle,
        content: sanitizedContent,
        problem_type: problemType,
        correct_answer:
          problemType === 'extended' ? '' : sanitizedCorrectAnswer,
        answer_config: answerConfig,
        auto_mark: autoMarkValue,
        status,
        assets,
        solution_text: sanitizedSolutionText,
        solution_assets,
        tag_ids: selectedTagIds, // Always send the array, even if empty
      };

      // Add subject_id and problem_id for create operations
      if (!isEditMode) {
        (payload as any).subject_id = subjectId;
        (payload as any).id = problemUuid; // Use client-generated UUID
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
        setMcqChoices(
          ANSWER_CONFIG_CONSTANTS.MCQ.DEFAULT_CHOICES.map(id => ({
            id,
            text: '',
          }))
        );
        setMcqCorrectChoiceId('');
        setShortAnswerConfig({
          mode: 'text',
          acceptable_answers: [],
        });
        setUseEnhancedMcq(false);
        setUseEnhancedShort(false);
        setSelectedTagIds([]);
        setProblemType('short');
        setStatus('needs_review');
        setAutoMark(false);
        setProblemUuid(null); // Reset UUID so a new one is generated next time
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

  // Generate UUID for new problems when form is expanded
  const [problemUuid, setProblemUuid] = useState<string | null>(null);

  // Generate UUID when form is expanded for new problems
  useEffect(() => {
    if (!isEditMode && isExpanded && !problemUuid) {
      setProblemUuid(globalThis.crypto?.randomUUID?.() ?? `rnd-${Date.now()}`);
    }
  }, [isEditMode, isExpanded, problemUuid]);

  // Cleanup function for unsaved problem assets (can be called explicitly or via effect)
  const cleanupUnsavedProblem = useCallback(
    async (uuidToCleanup: string | null) => {
      // Only cleanup in create mode and if we have a problemUuid
      if (isEditMode || !uuidToCleanup) return;

      try {
        // Use sendBeacon for more reliable cleanup on page unload
        if (navigator.sendBeacon) {
          const formData = new FormData();
          formData.append('problemId', uuidToCleanup);
          navigator.sendBeacon(
            `/api/problems/${uuidToCleanup}/cleanup`,
            formData
          );
        } else {
          // Fallback to fetch with keepalive
          await fetch(`/api/problems/${uuidToCleanup}/cleanup`, {
            method: 'DELETE',
            keepalive: true,
          });
        }
      } catch (error) {
        console.warn('Failed to cleanup unsaved problem assets:', error);
      }
    },
    [isEditMode]
  );

  // Clean up unsaved problem assets when component unmounts or user leaves page (CREATE mode only)
  useEffect(() => {
    // Cleanup on page unload/refresh/close (when user truly leaves)
    const handleBeforeUnload = () => {
      cleanupUnsavedProblem(problemUuid);
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Return cleanup function for component unmount (navigation within app)
    return () => {
      cleanupUnsavedProblem(problemUuid);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [problemUuid, cleanupUnsavedProblem]);

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
          <RichTextEditor
            ref={contentEditorRef}
            content={content}
            onChange={setContent}
            placeholder="Describe the problem with rich formatting, math equations, and more..."
            height="300px"
            maxHeight="500px"
            disabled={isSubmitting}
            maxLength={VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX}
            showCharacterCount={true}
          />
        </div>
      </div>

      {/* problem assets */}
      <div className="form-row-start">
        <label className="form-label pt-2">Problem assets</label>
        <div className="flex-1">
          <FileManager
            role="problem"
            problemId={isEditMode ? problem.id : problemUuid || 'disabled'}
            isEditMode={isEditMode}
            initialFiles={problemAssets}
            onFilesChange={setProblemAssets}
            onInsertImage={handleInsertProblemImage}
            disabled={!isEditMode && !problemUuid}
          />
        </div>
      </div>

      {/* Problem Settings */}
      <div className="form-section">
        <div className="form-row">
          <label className="form-label">Type</label>
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

        <div className="form-row">
          <label className="form-label">Status</label>
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

        <div className="form-row">
          <label className="form-label">Options</label>
          <label className="flex items-center gap-2 text-sm">
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
        </div>
      </div>

      {/* Answer Configuration - MCQ */}
      {problemType === 'mcq' && (
        <div className="form-section">
          <div className="form-row">
            <label className="form-label">Answer type</label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useEnhancedMcq}
                onChange={e => setUseEnhancedMcq(e.target.checked)}
                className="form-checkbox"
              />
              Use choice picker
            </label>
          </div>

          {useEnhancedMcq ? (
            <MCQChoiceEditor
              choices={mcqChoices}
              correctChoiceId={mcqCorrectChoiceId}
              onChoicesChange={setMcqChoices}
              onCorrectChoiceChange={setMcqCorrectChoiceId}
              disabled={isSubmitting}
            />
          ) : (
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
        </div>
      )}

      {/* Answer Configuration - Short */}
      {problemType === 'short' && (
        <div className="form-section">
          <div className="form-row">
            <label className="form-label">Answer type</label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useEnhancedShort}
                onChange={e => setUseEnhancedShort(e.target.checked)}
                className="form-checkbox"
              />
              Advanced answer matching
            </label>
          </div>

          {useEnhancedShort ? (
            <ShortAnswerConfig
              value={shortAnswerConfig}
              onChange={setShortAnswerConfig}
              disabled={isSubmitting}
            />
          ) : (
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
        </div>
      )}

      {/* solution text + assets */}
      <div className="form-row-start">
        <label className="form-label pt-2">Solution (text)</label>
        <div className="flex-1 relative">
          <RichTextEditor
            ref={solutionEditorRef}
            content={solutionText}
            onChange={setSolutionText}
            placeholder="What did you do wrong? What did you learn from it?"
            height="300px"
            maxHeight="500px"
            disabled={isSubmitting}
            maxLength={VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX}
            showCharacterCount={true}
          />
        </div>
      </div>
      <div className="form-row-start">
        <label className="form-label pt-2">Solution assets</label>
        <div className="flex-1">
          <FileManager
            role="solution"
            problemId={isEditMode ? problem.id : problemUuid || 'disabled'}
            isEditMode={isEditMode}
            initialFiles={solutionAssets}
            onFilesChange={setSolutionAssets}
            onInsertImage={handleInsertSolutionImage}
            disabled={!isEditMode && !problemUuid}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="form-section">
        <label className="form-label-top">Tags</label>
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
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
            variant="outline"
            onClick={async () => {
              // Clean up unsaved assets before resetting UUID
              if (problemUuid) {
                await cleanupUnsavedProblem(problemUuid);
              }
              setProblemUuid(null); // Reset UUID so a new one is generated next time
              setIsExpanded(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
