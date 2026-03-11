'use client';

import { cn } from '@/lib/utils';

interface MasteryStatusBarProps {
  wrong: number;
  needsReview: number;
  mastered: number;
}

export function MasteryStatusBar({
  wrong,
  needsReview,
  mastered,
}: MasteryStatusBarProps) {
  const total = wrong + needsReview + mastered;

  if (total === 0) {
    return (
      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
    );
  }

  const wrongPct = (wrong / total) * 100;
  const reviewPct = (needsReview / total) * 100;
  const masteredPct = (mastered / total) * 100;

  // Ensure minimum visible width for non-zero segments
  const MIN_WIDTH = 3;
  const segments = [
    { pct: wrongPct, count: wrong, color: 'bg-red-500 dark:bg-red-400' },
    {
      pct: reviewPct,
      count: needsReview,
      color: 'bg-amber-500 dark:bg-amber-400',
    },
    {
      pct: masteredPct,
      count: mastered,
      color: 'bg-emerald-500 dark:bg-emerald-400',
    },
  ].filter(s => s.count > 0);

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
      {segments.map((segment, i) => (
        <div
          key={i}
          className={cn('h-full transition-all duration-300', segment.color)}
          style={{
            width: `${Math.max(segment.pct, MIN_WIDTH)}%`,
          }}
        />
      ))}
    </div>
  );
}
