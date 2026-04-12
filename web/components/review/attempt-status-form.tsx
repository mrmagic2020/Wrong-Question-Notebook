'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import CauseSelector from '@/components/reflection/cause-selector';
import { ProblemStatus } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { ATTEMPT_CONSTANTS } from '@/lib/constants';
import { apiUrl } from '@/lib/api-utils';
import {
  XCircle,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Pencil,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const statusOptions = [
  {
    value: 'wrong' as ProblemStatus,
    label: 'Wrong',
    icon: XCircle,
    activeBg:
      'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800',
    hoverBg:
      'hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/10 dark:hover:border-red-900/30',
  },
  {
    value: 'needs_review' as ProblemStatus,
    label: 'Needs Review',
    icon: AlertCircle,
    activeBg:
      'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800',
    hoverBg:
      'hover:bg-yellow-50 hover:border-yellow-200 dark:hover:bg-yellow-950/10 dark:hover:border-yellow-900/30',
  },
  {
    value: 'mastered' as ProblemStatus,
    label: 'Mastered',
    icon: CheckCircle,
    activeBg:
      'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-200 border-green-300 dark:border-green-800',
    hoverBg:
      'hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950/10 dark:hover:border-green-900/30',
  },
];

interface AttemptStatusFormProps {
  problemId: string;
  currentStatus: ProblemStatus;
  autoMark: boolean;
  attemptId?: string | null;
  autoMarkCorrect?: boolean | null;
  hasSubmitted?: boolean;
  onSaved: (
    status: ProblemStatus,
    attemptId: string,
    details?: {
      cause?: string | null;
      reflectionNotes?: string | null;
      submittedResponse?: string | null;
      needsReviewIsCorrect?: boolean | null;
    }
  ) => void;
  initialSavedState?: {
    selectedStatus: ProblemStatus;
    attemptId: string;
    cause?: string | null;
    reflectionNotes?: string | null;
    submittedResponse?: string | null;
    needsReviewIsCorrect?: boolean | null;
  } | null;
  disabled?: boolean;
}

export default function AttemptStatusForm({
  problemId,
  currentStatus,
  autoMark,
  attemptId,
  autoMarkCorrect,
  hasSubmitted,
  onSaved,
  initialSavedState,
  disabled,
}: AttemptStatusFormProps) {
  const t = useTranslations('Review');
  const tCommon = useTranslations('Common');

  const [selectedStatus, setSelectedStatus] = useState<ProblemStatus | null>(
    initialSavedState?.selectedStatus ?? null
  );
  const [cause, setCause] = useState<string | undefined>(
    initialSavedState?.cause ?? undefined
  );
  const [notes, setNotes] = useState(initialSavedState?.reflectionNotes ?? '');
  const [response, setResponse] = useState(
    initialSavedState?.submittedResponse ?? ''
  );
  const [needsReviewIsCorrect, setNeedsReviewIsCorrect] = useState<boolean>(
    initialSavedState?.needsReviewIsCorrect ?? false
  );
  const [isSaving, setIsSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [savedState, setSavedState] = useState<{
    selectedStatus: ProblemStatus;
    attemptId: string;
  } | null>(
    initialSavedState
      ? {
          selectedStatus: initialSavedState.selectedStatus,
          attemptId: initialSavedState.attemptId,
        }
      : null
  );
  const [isEditing, setIsEditing] = useState(false);

  const NOTES_MAX = ATTEMPT_CONSTANTS.MAX_REFLECTION_NOTES_LENGTH;
  const RESPONSE_MAX = ATTEMPT_CONSTANTS.MAX_RESPONSE_LENGTH;

  // Pre-attempt state: auto-mark problem where answer hasn't been submitted yet
  const isPreAttempt = autoMark && !hasSubmitted;

  // Whether the form is in saved (read-only) state
  const isSaved = savedState !== null && !isEditing;

  // Determine which status options are available based on auto-mark constraints
  const getAvailableOptions = () => {
    if (
      !autoMark ||
      autoMarkCorrect === null ||
      autoMarkCorrect === undefined
    ) {
      return statusOptions;
    }
    if (autoMarkCorrect === false) {
      return statusOptions.filter(
        o => o.value === 'wrong' || o.value === 'needs_review'
      );
    }
    // autoMarkCorrect === true
    return statusOptions.filter(
      o => o.value === 'needs_review' || o.value === 'mastered'
    );
  };

  const availableOptions = getAvailableOptions();

  // Show correctness sub-option for needs_review on non-auto-mark problems
  const showNeedsReviewSubOption =
    selectedStatus === 'needs_review' &&
    (!autoMark || autoMarkCorrect === null || autoMarkCorrect === undefined);

  const handleStatusChange = (status: ProblemStatus) => {
    setSelectedStatus(status);
    if (status !== 'needs_review') {
      setNeedsReviewIsCorrect(false);
    }
  };

  const handleNeedsReviewToggle = (isCorrect: boolean) => {
    setNeedsReviewIsCorrect(isCorrect);
    setCause(undefined); // Reset cause since categories switch
  };

  // Auto-select default status based on auto-mark result (only when not restoring from saved state)
  const getDefaultStatus = (): ProblemStatus | null => {
    if (initialSavedState) return null;
    if (!autoMark || autoMarkCorrect === null || autoMarkCorrect === undefined)
      return null;
    return autoMarkCorrect ? 'mastered' : 'wrong';
  };

  // Apply default selection when form becomes active (e.g. after answer submission)
  useEffect(() => {
    if (
      !isPreAttempt &&
      !isSaved &&
      selectedStatus === null &&
      !initialSavedState
    ) {
      const defaultStatus = getDefaultStatus();
      if (defaultStatus) {
        setSelectedStatus(defaultStatus);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreAttempt, autoMark, autoMarkCorrect, hasSubmitted]);

  // Derive correctness for cause selector: use the auto-mark result when
  // available, otherwise fall back to status-based derivation
  const effectiveIsCorrect =
    autoMarkCorrect !== null && autoMarkCorrect !== undefined
      ? autoMarkCorrect
      : selectedStatus === 'needs_review'
        ? needsReviewIsCorrect
        : selectedStatus === 'mastered';

  const handleSave = async () => {
    if (!selectedStatus) return;
    setIsSaving(true);

    try {
      let resultAttemptId: string;

      if (attemptId || savedState?.attemptId) {
        // PATCH existing attempt
        const patchId = savedState?.attemptId || attemptId!;
        const patchBody: Record<string, unknown> = {
          selected_status: selectedStatus,
          cause: cause || null,
          reflection_notes: notes || null,
        };
        // Include response update for non-auto-mark edits
        if (!autoMark && response) {
          patchBody.submitted_answer = response;
        }
        const res = await fetch(apiUrl(`/api/attempts/${patchId}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchBody),
        });
        if (!res.ok) throw new Error(t('failedSaveAssessment'));
        resultAttemptId = patchId;
      } else {
        // POST new attempt (non-auto-mark or no existing attempt)
        const res = await fetch(apiUrl('/api/attempts'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problem_id: problemId,
            submitted_answer:
              response || ATTEMPT_CONSTANTS.SELF_ASSESSED_PLACEHOLDER,
            is_correct:
              selectedStatus === 'needs_review'
                ? needsReviewIsCorrect
                : selectedStatus === 'mastered',
            is_self_assessed: true,
            selected_status: selectedStatus,
            cause: cause || undefined,
            reflection_notes: notes || undefined,
          }),
        });
        if (!res.ok) throw new Error(t('failedSaveAssessment'));
        const result = await res.json();
        resultAttemptId = result.data.id;
      }

      setSavedState({ selectedStatus, attemptId: resultAttemptId });
      setIsEditing(false);
      onSaved(selectedStatus, resultAttemptId, {
        cause: cause || null,
        reflectionNotes: notes || null,
        submittedResponse: response || null,
        needsReviewIsCorrect:
          selectedStatus === 'needs_review' ? needsReviewIsCorrect : null,
      });
    } catch {
      toast.error(t('failedToSaveAssessment'));
    } finally {
      setIsSaving(false);
    }
  };

  // Pre-attempt state
  if (isPreAttempt) {
    return (
      <div className="opacity-50 pointer-events-none">
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
          {t('assessment')}
        </h3>
        <p className="text-xs text-muted-foreground">{t('submitFirst')}</p>
        <div className="space-y-1.5 mt-2">
          {statusOptions.map(option => {
            const Icon = option.icon;
            return (
              <div
                key={option.value}
                className="w-full px-3 py-2 rounded-lg text-left text-sm font-medium border border-border bg-background flex items-center gap-2"
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{t(option.value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Saved state (read-only)
  if (isSaved && savedState) {
    const savedOption = statusOptions.find(
      o => o.value === savedState.selectedStatus
    )!;
    const SavedIcon = savedOption.icon;
    return (
      <div>
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
          {t('assessment')}
        </h3>
        <div
          className={cn(
            'w-full px-3 py-2.5 rounded-lg text-sm font-medium border flex items-center gap-2',
            savedOption.activeBg
          )}
        >
          <SavedIcon className="h-4 w-4 flex-shrink-0" />
          <span>{t(savedState.selectedStatus)}</span>
        </div>
        {savedState.selectedStatus === 'needs_review' &&
          showNeedsReviewSubOption && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {needsReviewIsCorrect
                ? t('correctButUnsure')
                : t('wrongButClose')}
            </p>
          )}
        {cause &&
          (() => {
            const matched = (
              effectiveIsCorrect
                ? ATTEMPT_CONSTANTS.CAUSE_CATEGORIES.CORRECT
                : ATTEMPT_CONSTANTS.CAUSE_CATEGORIES.INCORRECT
            ).find(c => c.value === cause);
            return (
              <p className="text-xs text-muted-foreground mt-1.5">
                {t('cause')}: {matched ? t(matched.labelKey) : cause}
              </p>
            );
          })()}
        {notes && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {t('notes')}: {notes}
          </p>
        )}
        {!disabled && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 px-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="w-3 h-3" />
            {tCommon('edit')}
          </Button>
        )}
      </div>
    );
  }

  // Active state
  return (
    <div>
      <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
        {t('assessment')}
      </h3>
      <div className="space-y-1.5">
        {availableOptions.map(option => {
          const Icon = option.icon;
          return (
            <button
              type="button"
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={disabled}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-left text-sm font-medium border transition-all flex items-center gap-2',
                selectedStatus === option.value
                  ? option.activeBg
                  : `border-border bg-background ${option.hoverBg}`
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{t(option.value)}</span>
            </button>
          );
        })}
      </div>

      {/* Needs Review correctness sub-option */}
      {showNeedsReviewSubOption && (
        <div className="mt-1.5 space-y-1">
          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
            {t('howDidItGo')}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleNeedsReviewToggle(true)}
              disabled={disabled}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all text-left',
                needsReviewIsCorrect
                  ? 'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-200 border-green-300 dark:border-green-800'
                  : 'border-border bg-background hover:bg-green-50 dark:hover:bg-green-950/10 hover:border-green-200 dark:hover:border-green-900/30'
              )}
            >
              {t('correctButUnsure')}
            </button>
            <button
              type="button"
              onClick={() => handleNeedsReviewToggle(false)}
              disabled={disabled}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all text-left',
                !needsReviewIsCorrect
                  ? 'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800'
                  : 'border-border bg-background hover:bg-red-50 dark:hover:bg-red-950/10 hover:border-red-200 dark:hover:border-red-900/30'
              )}
            >
              {t('wrongButClose')}
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2 text-center">
        {t('currentStatus', {
          status: t(
            currentStatus === 'needs_review' ? 'needsReview' : currentStatus
          ),
        })}
      </p>

      {/* Collapsible details */}
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 mt-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 transition-transform',
              detailsOpen && 'rotate-90'
            )}
          />
          {t('detailsOptional')}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {/* Response textarea — non-auto-mark only */}
          {!autoMark && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t('yourResponse')}
                </label>
                <span
                  className={cn(
                    'text-xs',
                    response.length >= RESPONSE_MAX
                      ? 'text-amber-500'
                      : 'text-muted-foreground'
                  )}
                >
                  {response.length}/{RESPONSE_MAX}
                </span>
              </div>
              <Textarea
                value={response}
                onChange={e => setResponse(e.target.value)}
                maxLength={RESPONSE_MAX}
                placeholder={t('whatDidYouAnswer')}
                className="h-16 resize-none text-sm"
              />
            </div>
          )}

          {/* Cause selector */}
          {selectedStatus && (
            <CauseSelector
              value={cause}
              onChange={setCause}
              isCorrect={effectiveIsCorrect}
              t={t}
            />
          )}

          {/* Reflection notes */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {t('notes')}
              </label>
              <span
                className={cn(
                  'text-xs',
                  notes.length >= NOTES_MAX
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
                )}
              >
                {notes.length}/{NOTES_MAX}
              </span>
            </div>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={NOTES_MAX}
              placeholder={t('notesPlaceholder')}
              className="h-16 resize-none text-sm"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={!selectedStatus || isSaving || disabled}
        size="sm"
        className="w-full mt-3 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t('saveAssessment')
        )}
      </Button>
    </div>
  );
}
