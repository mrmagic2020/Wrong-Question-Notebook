'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfidenceSelector from '@/components/reflection/confidence-selector';
import { SPACED_REPETITION_CONSTANTS } from '@/lib/constants';

interface SRCorrectnessPromptProps {
  problemId: string;
  onCompleted: (isCorrect: boolean, confidence: number) => void;
}

export default function SRCorrectnessPrompt({
  problemId,
  onCompleted,
}: SRCorrectnessPromptProps) {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (isCorrect === null) return;
    setSubmitting(true);

    const effectiveConfidence =
      confidence ?? SPACED_REPETITION_CONSTANTS.DEFAULT_CONFIDENCE;

    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problemId,
          submitted_answer: isCorrect
            ? 'self-assessed correct'
            : 'self-assessed incorrect',
          is_correct: isCorrect,
          is_self_assessed: true,
          confidence: effectiveConfidence,
        }),
      });

      if (!res.ok) {
        console.error('Failed to create attempt');
      }
    } catch (e) {
      console.error('Failed to create attempt:', e);
    }

    onCompleted(isCorrect, effectiveConfidence);
    setSubmitting(false);
  };

  return (
    <div className="rounded-xl border border-amber-200/40 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
        How did you do?
      </h4>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCorrect(true)}
          className={cn(
            'flex-1 rounded-xl transition-all',
            isCorrect === true
              ? 'bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white dark:bg-green-700 dark:border-green-700'
              : 'hover:border-green-300 dark:hover:border-green-700'
          )}
        >
          <CheckCircle className="h-4 w-4 mr-1.5" />
          Correct
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCorrect(false)}
          className={cn(
            'flex-1 rounded-xl transition-all',
            isCorrect === false
              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:text-white dark:bg-red-700 dark:border-red-700'
              : 'hover:border-red-300 dark:hover:border-red-700'
          )}
        >
          <XCircle className="h-4 w-4 mr-1.5" />
          Incorrect
        </Button>
      </div>

      <ConfidenceSelector value={confidence} onChange={setConfidence} />

      <Button
        onClick={handleConfirm}
        disabled={isCorrect === null || submitting}
        size="sm"
        className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
      </Button>
    </div>
  );
}
