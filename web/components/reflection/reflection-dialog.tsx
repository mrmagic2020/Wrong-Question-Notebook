'use client';

import { useState, useRef, useEffect } from 'react';
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
import ConfidenceSelector from './confidence-selector';
import CauseSelector from './cause-selector';
import { cn } from '@/lib/utils';
import { ATTEMPT_CONSTANTS } from '@/lib/constants';

interface ReflectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** For auto-mark mode: existing attempt ID to PATCH */
  attemptId?: string;
  /** Whether the attempt was correct (auto-mark mode) */
  isCorrect?: boolean | null;
  /** New attempt mode: POST a self-assessed attempt */
  isNewAttempt?: boolean;
  problemId?: string;
  /** Existing values to pre-populate in edit mode */
  initialConfidence?: number | null;
  initialCause?: string | null;
  initialNotes?: string | null;
  /** The recorded response to display (non-editable) in edit mode */
  submittedAnswer?: string;
  onSaved?: () => void;
  onDismissed?: () => void;
}

export default function ReflectionDialog({
  open,
  onOpenChange,
  attemptId,
  isCorrect: initialIsCorrect,
  isNewAttempt = false,
  problemId,
  initialConfidence,
  initialCause,
  initialNotes,
  submittedAnswer,
  onSaved,
  onDismissed,
}: ReflectionDialogProps) {
  const [selfAssessment, setSelfAssessment] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [cause, setCause] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [response, setResponse] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const NOTES_MAX = ATTEMPT_CONSTANTS.MAX_REFLECTION_NOTES_LENGTH;
  const RESPONSE_MAX = ATTEMPT_CONSTANTS.MAX_RESPONSE_LENGTH;

  // Determine effective correctness
  const effectiveIsCorrect = isNewAttempt ? selfAssessment : initialIsCorrect;

  const notesAtLimit = notes.length >= NOTES_MAX;
  const responseAtLimit = response.length >= RESPONSE_MAX;

  // Populate form when dialog opens
  useEffect(() => {
    if (open) {
      setSelfAssessment(null);
      setConfidence(initialConfidence ?? null);
      setCause(initialCause || undefined);
      setNotes(initialNotes || '');
      setResponse('');
    }
  }, [open, initialConfidence, initialCause, initialNotes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isNewAttempt && problemId) {
        // POST new self-assessed attempt
        const res = await fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problem_id: problemId,
            submitted_answer: response || 'Self-assessed',
            is_correct: selfAssessment,
            is_self_assessed: true,
            confidence,
            cause,
            reflection_notes: notes || undefined,
          }),
        });
        if (!res.ok) throw new Error('Failed to save attempt');
      } else if (attemptId) {
        // PATCH existing attempt with reflection data
        const res = await fetch(`/api/attempts/${attemptId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            confidence,
            cause: cause || null,
            reflection_notes: notes || null,
          }),
        });
        if (!res.ok) throw new Error('Failed to save reflection');
      }
      onSaved?.();
      onOpenChange(false);
    } catch {
      // Silently fail - user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismiss = () => {
    onOpenChange(false);
    onDismissed?.();
  };

  const canSave =
    (isNewAttempt
      ? selfAssessment !== null && confidence !== null
      : confidence !== null) &&
    notes.length <= NOTES_MAX &&
    response.length <= RESPONSE_MAX;

  return (
    <Dialog open={open} onOpenChange={v => !v && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isNewAttempt ? 'Log Attempt' : 'Reflect on Your Answer'}
          </DialogTitle>
          <DialogDescription>
            {isNewAttempt
              ? 'Record how you did on this problem.'
              : 'Take a moment to reflect on your attempt.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Result badge (auto-mark mode) */}
          {!isNewAttempt && initialIsCorrect !== null && (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                initialIsCorrect
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              )}
            >
              <span>{initialIsCorrect ? '\u2713' : '\u2717'}</span>
              {initialIsCorrect ? 'Correct' : 'Incorrect'}
            </div>
          )}

          {/* Recorded response (edit mode, non-editable) */}
          {!isNewAttempt && submittedAnswer && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Your response
              </span>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-muted/50 rounded-lg px-3 py-2">
                {submittedAnswer}
              </p>
            </div>
          )}

          {/* Self-assessment toggle (manual mode) */}
          {isNewAttempt && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Did you get it right?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelfAssessment(true)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-all border',
                    selfAssessment === true
                      ? 'bg-green-600 text-white border-green-600 dark:bg-green-500 dark:border-green-500'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-300'
                  )}
                >
                  Correct
                </button>
                <button
                  type="button"
                  onClick={() => setSelfAssessment(false)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-all border',
                    selfAssessment === false
                      ? 'bg-red-600 text-white border-red-600 dark:bg-red-500 dark:border-red-500'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-red-300'
                  )}
                >
                  Incorrect
                </button>
              </div>
            </div>
          )}

          {/* Response textarea (manual mode) */}
          {isNewAttempt && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your response{' '}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <span
                  className={cn(
                    'text-xs',
                    responseAtLimit ? 'text-amber-500' : 'text-muted-foreground'
                  )}
                >
                  {response.length}/{RESPONSE_MAX}
                </span>
              </div>
              <Textarea
                value={response}
                onChange={e => setResponse(e.target.value)}
                maxLength={RESPONSE_MAX}
                placeholder="What did you answer?"
                className="h-20 resize-none"
              />
            </div>
          )}

          {/* Confidence selector */}
          <ConfidenceSelector value={confidence} onChange={setConfidence} />

          {/* Cause selector (shown when correctness is known) */}
          {effectiveIsCorrect !== null && effectiveIsCorrect !== undefined && (
            <CauseSelector
              value={cause}
              onChange={setCause}
              isCorrect={effectiveIsCorrect}
              onOtherSelected={() => notesRef.current?.focus()}
            />
          )}

          {/* Reflection notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <span
                className={cn(
                  'text-xs',
                  notesAtLimit ? 'text-amber-500' : 'text-muted-foreground'
                )}
              >
                {notes.length}/{NOTES_MAX}
              </span>
            </div>
            <Textarea
              ref={notesRef}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={NOTES_MAX}
              placeholder="What will you do differently next time?"
              className="h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleDismiss} disabled={isSaving}>
            Skip
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
