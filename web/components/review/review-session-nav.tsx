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
  /** Custom wrapper className (replaces default card styling) */
  wrapperClassName?: string;
  /** Whether this is the foremost (furthest reached) problem in the session */
  isForemost?: boolean;
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
  wrapperClassName,
  isForemost = true,
}: ReviewSessionNavProps) {
  const progressPercent =
    totalProblems > 0
      ? ((completedCount + skippedCount) / totalProblems) * 100
      : 0;

  return (
    <div
      className={
        wrapperClassName ||
        'bg-card rounded-lg border border-border p-4 space-y-3'
      }
    >
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
          variant="outline"
          size="sm"
          className="hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/20 dark:hover:border-rose-800/40"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <Button
          onClick={onSkip}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50/50 dark:hover:text-yellow-400 dark:hover:bg-yellow-950/20"
        >
          <SkipForward className="h-4 w-4 mr-1" />
          Skip
        </Button>

        {isLastProblem && nextEnabled ? (
          <Button
            onClick={onFinish}
            size="sm"
            className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-700 hover:via-orange-700 hover:to-rose-700 dark:from-amber-700 dark:via-orange-700 dark:to-rose-700 dark:hover:from-amber-800 dark:hover:via-orange-800 dark:hover:to-rose-800 text-white shadow-sm"
          >
            Finish
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!hasNext || !nextEnabled}
            variant={nextEnabled && isForemost ? undefined : 'outline'}
            size="sm"
            className={
              nextEnabled && isForemost
                ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white'
                : 'hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/20 dark:hover:border-rose-800/40'
            }
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
