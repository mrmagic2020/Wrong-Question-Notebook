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
import { useUnsavedChanges } from '@/lib/hooks/useUnsavedChanges';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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

  // Track whether the form has unsaved data
  const hasUnsavedData = useMemo(() => {
    if (!isExpanded && !isEditMode) return false;
    return (
      title.trim().length > 0 ||
      content.length > 0 ||
      problemAssets.length > 0 ||
      solutionText.length > 0 ||
      solutionAssets.length > 0 ||
      selectedTagIds.length > 0
    );
  }, [
    isExpanded,
    isEditMode,
    title,
    content,
    problemAssets,
    solutionText,
    solutionAssets,
    selectedTagIds,
  ]);

  // Warn user before leaving page with unsaved form data
  useUnsavedChanges(hasUnsavedData);

  // Clean up unsaved problem assets when component unmounts or user leaves page
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupUnsavedProblem(problemUuid);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

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
          className="flex-1 border-dashed text-muted-foreground hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:text-amber-900 dark:hover:text-amber-100 justify-start transition-colors"
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

      {/* All sections in a single accordion */}
      <Accordion
        type="multiple"
        defaultValue={['content', 'settings', 'answer']}
      >
        {/* Content + Problem Assets */}
        <AccordionItem
          value="content"
          className="rounded-2xl border border-gray-200/40 dark:border-gray-700/30 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/40 dark:to-gray-700/20 px-4"
        >
          <AccordionTrigger className="hover:no-underline py-3">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-300">
              Content <span className="text-red-500">*</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="form-row-start">
              <label className="form-label pt-2">Content</label>
              <div className="flex-1 relative">
                <RichTextEditor
                  ref={contentEditorRef}
                  content={content}
                  onChange={setContent}
                  placeholder="Describe the problem with rich formatting, math equations, and more..."
                  height="200px"
                  maxHeight="500px"
                  disabled={isSubmitting}
                  maxLength={VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX}
                  showCharacterCount={true}
                />
              </div>
            </div>
            <div className="form-row-start">
              <label className="form-label pt-2">Problem assets</label>
              <div className="flex-1">
                <FileManager
                  role="problem"
                  problemId={
                    isEditMode ? problem.id : problemUuid || 'disabled'
                  }
                  isEditMode={isEditMode}
                  initialFiles={problemAssets}
                  onFilesChange={setProblemAssets}
                  onInsertImage={handleInsertProblemImage}
                  disabled={!isEditMode && !problemUuid}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Problem Settings */}
        <AccordionItem
          value="settings"
          className="rounded-2xl border border-amber-200/40 dark:border-amber-800/30 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 px-4 mt-4"
        >
          <AccordionTrigger className="hover:no-underline py-3">
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Problem Settings <span className="text-red-500">*</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="form-section">
              <div className="form-row">
                <label className="form-label">Type</label>
                <Select
                  value={problemType}
                  onValueChange={value => setProblemType(value as ProblemType)}
                >
                  <SelectTrigger className="w-48 rounded-xl">
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
                  <SelectTrigger className="w-36 rounded-xl">
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
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto-mark-switch"
                    checked={autoMarkValue}
                    disabled={isAutoMarkDisabled}
                    onCheckedChange={setAutoMark}
                  />
                  <Label
                    htmlFor="auto-mark-switch"
                    className={`text-sm cursor-pointer ${isAutoMarkDisabled ? 'text-muted-foreground' : ''}`}
                  >
                    Auto Mark
                    {isAutoMarkDisabled && (
                      <span className="text-body-sm text-muted-foreground ml-1">
                        (not available for extended response)
                      </span>
                    )}
                  </Label>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Answer Configuration - MCQ */}
        {problemType === 'mcq' && (
          <AccordionItem
            value="answer"
            className="rounded-2xl border border-blue-200/40 dark:border-blue-800/30 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 px-4 mt-4"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Answer Configuration
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="form-section">
                <div className="form-row">
                  <span className="form-label">Mode</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="enhanced-mcq-switch"
                      checked={useEnhancedMcq}
                      onCheckedChange={setUseEnhancedMcq}
                    />
                    <Label
                      htmlFor="enhanced-mcq-switch"
                      className="text-sm cursor-pointer"
                    >
                      Use choice picker
                    </Label>
                  </div>
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
                      maxLength={
                        VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX
                      }
                      onChange={e => setMcqChoice(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Answer Configuration - Short */}
        {problemType === 'short' && (
          <AccordionItem
            value="answer"
            className="rounded-2xl border border-rose-200/40 dark:border-rose-800/30 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20 px-4 mt-4"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <span className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                Answer Configuration
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="form-section">
                <div className="form-row">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="enhanced-short-switch"
                      checked={useEnhancedShort}
                      onCheckedChange={setUseEnhancedShort}
                    />
                    <Label
                      htmlFor="enhanced-short-switch"
                      className="text-sm cursor-pointer"
                    >
                      Advanced Mode
                    </Label>
                  </div>
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
                      maxLength={
                        VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX
                      }
                      onChange={e => setShortText(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
        {/* Solution */}
        <AccordionItem
          value="solution"
          className="rounded-2xl border border-green-200/40 dark:border-green-800/30 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/20 px-4 mt-4"
        >
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                Solution
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="form-row-start">
              <label className="form-label pt-2">Solution (text)</label>
              <div className="flex-1 relative">
                <RichTextEditor
                  ref={solutionEditorRef}
                  content={solutionText}
                  onChange={setSolutionText}
                  placeholder="What did you do wrong? What did you learn from it?"
                  height="200px"
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
                  problemId={
                    isEditMode ? problem.id : problemUuid || 'disabled'
                  }
                  isEditMode={isEditMode}
                  initialFiles={solutionAssets}
                  onFilesChange={setSolutionAssets}
                  onInsertImage={handleInsertSolutionImage}
                  disabled={!isEditMode && !problemUuid}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Tags */}
        <AccordionItem
          value="tags"
          className="rounded-2xl border border-gray-200/40 dark:border-gray-700/30 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/40 dark:to-gray-700/20 px-4 mt-4"
        >
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-300">
                Tags
              </span>
              {selectedTagIds.length > 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {selectedTagIds.length} selected
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
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
                <p className="text-body-sm text-muted-foreground">
                  No tags yet.
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
