'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ERROR_CATEGORY_LABELS,
  ERROR_CATEGORY_COLORS,
  SUBJECT_CONSTANTS,
} from '@/lib/constants';
import type { SubjectColor, ErrorBroadCategory } from '@/lib/constants';
import type { WeakSpot } from '@/lib/types';

interface WeakSpotCardProps {
  weakSpot: WeakSpot;
  onReview: (subjectId: string, problemIds: string[]) => void;
}

export function WeakSpotCard({ weakSpot, onReview }: WeakSpotCardProps) {
  const color = (weakSpot.subject_color || 'amber') as SubjectColor;
  const colorConfig =
    SUBJECT_CONSTANTS.COLOR_GRADIENTS[color] ||
    SUBJECT_CONSTANTS.COLOR_GRADIENTS.amber;

  const errorCategory = weakSpot.dominant_error_type as ErrorBroadCategory;
  const errorColors = ERROR_CATEGORY_COLORS[errorCategory];
  const errorLabel = ERROR_CATEGORY_LABELS[errorCategory];

  return (
    <div
      className={cn(
        'rounded-2xl border bg-gradient-to-br p-4 space-y-3',
        colorConfig.light,
        colorConfig.dark,
        colorConfig.border
      )}
    >
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {weakSpot.topic_label}
        </h4>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              colorConfig.icon,
              colorConfig.iconColor
            )}
          >
            {weakSpot.subject_name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {weakSpot.problem_count}{' '}
            {weakSpot.problem_count === 1 ? 'problem' : 'problems'}
          </span>
        </div>
      </div>

      {weakSpot.trend_phrase && (
        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {weakSpot.trend_phrase}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        {errorColors && errorLabel ? (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
              errorColors.bg,
              errorColors.text
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', errorColors.dot)} />
            {errorLabel}
          </span>
        ) : (
          <span />
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn('text-xs rounded-xl', colorConfig.buttonHover)}
          onClick={() => onReview(weakSpot.subject_id, weakSpot.problem_ids)}
        >
          Review
        </Button>
      </div>
    </div>
  );
}
