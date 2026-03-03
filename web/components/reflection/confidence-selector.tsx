'use client';

import { cn } from '@/lib/utils';
import { ATTEMPT_CONSTANTS } from '@/lib/constants';

interface ConfidenceSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
}

export default function ConfidenceSelector({
  value,
  onChange,
}: ConfidenceSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label
        id="confidence-label"
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Confidence
      </label>
      <div
        className="flex gap-1.5"
        role="group"
        aria-labelledby="confidence-label"
      >
        {[1, 2, 3, 4, 5].map(level => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            aria-pressed={value === level}
            aria-label={`${level} – ${ATTEMPT_CONSTANTS.CONFIDENCE_LABELS[level]}`}
            className={cn(
              'flex-1 h-9 rounded-lg text-sm font-medium transition-all',
              'border focus:outline-none focus:ring-2 focus:ring-violet-400/50',
              value === level
                ? 'bg-violet-600 text-white border-violet-600 dark:bg-violet-500 dark:border-violet-500 shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600'
            )}
          >
            {level}
          </button>
        ))}
      </div>
      {value && (
        <p className="text-xs text-violet-600 dark:text-violet-400">
          {ATTEMPT_CONSTANTS.CONFIDENCE_LABELS[value]}
        </p>
      )}
    </div>
  );
}
