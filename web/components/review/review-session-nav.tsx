'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

interface ReviewSessionNavProps {
  currentIndex: number;
  totalProblems: number;
  completedCount: number;
  skippedCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  /** Whether the Next button is enabled (e.g. status selected). Defaults to true. */
  nextEnabled?: boolean;
  /** Whether the current problem is the last one. Shows "Finish" instead of "Next". */
  isLastProblem?: boolean;
  onFinish?: () => void;
}

export default function ReviewSessionNav({
  currentIndex,
  totalProblems,
  completedCount,
  skippedCount,
  onPrevious,
  onNext,
  onSkip,
  hasPrevious,
  hasNext,
  nextEnabled = true,
  isLastProblem = false,
  onFinish,
}: ReviewSessionNavProps) {
  const progressPercent =
    totalProblems > 0
      ? ((completedCount + skippedCount) / totalProblems) * 100
      : 0;

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {completedCount} / {totalProblems} completed
            {skippedCount > 0 && (
              <span className="text-yellow-600 dark:text-yellow-400">
                {' '}
                &middot; {skippedCount} skipped
              </span>
            )}
          </span>
          <span>
            Problem {currentIndex + 1} of {totalProblems}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center">
        <Button
          onClick={onPrevious}
          disabled={!hasPrevious}
          variant="secondary"
          size="sm"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <Button
          onClick={onSkip}
          variant="outline"
          size="sm"
          className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:text-yellow-300 dark:hover:bg-yellow-950/30"
        >
          <SkipForward className="h-4 w-4 mr-1" />
          Skip
        </Button>

        {isLastProblem && nextEnabled ? (
          <Button
            onClick={onFinish}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Finish
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!hasNext || !nextEnabled}
            variant="secondary"
            size="sm"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
