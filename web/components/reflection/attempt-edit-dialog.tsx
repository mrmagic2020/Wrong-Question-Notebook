'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import CauseSelector from './cause-selector';
import { cn } from '@/lib/utils';
import { ATTEMPT_CONSTANTS } from '@/lib/constants';
import { Attempt } from '@/lib/types';
import { ProblemStatus } from '@/lib/schemas';
import { XCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusOptions = [
  {
    value: 'wrong' as ProblemStatus,
    labelKey: 'wrong' as const,
    icon: XCircle,
    activeBg:
      'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800',
  },
  {
    value: 'needs_review' as ProblemStatus,
    labelKey: 'needsReview' as const,
    icon: AlertCircle,
    activeBg:
      'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800',
  },
  {
    value: 'mastered' as ProblemStatus,
    labelKey: 'mastered' as const,
    icon: CheckCircle,
    activeBg:
      'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-200 border-green-300 dark:border-green-800',
  },
];

interface AttemptEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attempt: Attempt;
  onSaved: () => void;
}

export default function AttemptEditDialog({
  open,
  onOpenChange,
  attempt,
  onSaved,
}: AttemptEditDialogProps) {
  const t = useTranslations('Review');
  const tCommon = useTranslations('Common');
  const [selectedStatus, setSelectedStatus] = useState<ProblemStatus | null>(
    null
  );
  const [cause, setCause] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const NOTES_MAX = ATTEMPT_CONSTANTS.MAX_REFLECTION_NOTES_LENGTH;

  // Derive correctness for cause selector: use the attempt's auto-mark
  // result when available, otherwise fall back to status-based derivation
  const effectiveIsCorrect =
    attempt.is_correct !== null
      ? attempt.is_correct
      : selectedStatus === 'mastered';

  // Populate form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedStatus(attempt.selected_status ?? null);
      setCause(attempt.cause || undefined);
      setNotes(attempt.reflection_notes || '');
    }
  }, [open, attempt]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/attempts/${attempt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_status: selectedStatus,
          cause: cause || null,
          reflection_notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error(t('failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('editAttempt')}</DialogTitle>
          <DialogDescription>{t('editAttemptDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Result badge (read-only) */}
          {attempt.is_correct !== null && (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                attempt.is_correct
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              )}
            >
              <span>{attempt.is_correct ? '\u2713' : '\u2717'}</span>
              {attempt.is_correct ? t('correct') : t('incorrect')}
            </div>
          )}

          {/* Recorded response (read-only) */}
          {attempt.submitted_answer != null &&
            attempt.submitted_answer !==
              ATTEMPT_CONSTANTS.SELF_ASSESSED_PLACEHOLDER && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('yourResponse')}
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-muted/50 rounded-lg px-3 py-2">
                  {typeof attempt.submitted_answer === 'string'
                    ? attempt.submitted_answer
                    : JSON.stringify(attempt.submitted_answer)}
                </p>
              </div>
            )}

          {/* Status selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('status')}
            </label>
            <div className="space-y-1.5">
              {statusOptions
                .filter(option => {
                  // Self-assessed or unknown correctness: all options available
                  if (attempt.is_correct === null || attempt.is_self_assessed)
                    return true;
                  // Auto-mark incorrect: only Wrong and Needs Review
                  if (attempt.is_correct === false)
                    return (
                      option.value === 'wrong' ||
                      option.value === 'needs_review'
                    );
                  // Auto-mark correct: only Needs Review and Mastered
                  return (
                    option.value === 'needs_review' ||
                    option.value === 'mastered'
                  );
                })
                .map(option => {
                  const Icon = option.icon;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setSelectedStatus(option.value)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg text-left text-sm font-medium border transition-all flex items-center gap-2',
                        selectedStatus === option.value
                          ? option.activeBg
                          : 'border-border bg-background hover:bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{t(option.labelKey)}</span>
                    </button>
                  );
                })}
            </div>
          </div>

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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('notes')}{' '}
                <span className="text-muted-foreground font-normal">
                  ({t('optional')})
                </span>
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
              className="h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t('savingChanges') : t('saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
