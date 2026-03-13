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

  // Ensure minimum visible width for non-zero segments, then normalize
  const MIN_WIDTH = 3;
  const rawSegments = [
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

  // Apply minimum width then normalize so widths sum to 100%
  const clamped = rawSegments.map(s => ({
    ...s,
    width: Math.max(s.pct, MIN_WIDTH),
  }));
  const clampedTotal = clamped.reduce((sum, s) => sum + s.width, 0);
  const segments = clamped.map(s => ({
    ...s,
    width: (s.width / clampedTotal) * 100,
  }));

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
      {segments.map((segment, i) => (
        <div
          key={i}
          className={cn('h-full transition-all duration-300', segment.color)}
          style={{
            width: `${segment.width}%`,
          }}
        />
      ))}
    </div>
  );
}
