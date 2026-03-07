'use client';

import { cn } from '@/lib/utils';
import { SUBJECT_CONSTANTS } from '@/lib/constants';
import { Brain } from 'lucide-react';

interface ReviewDueButtonProps {
  dueCount: number;
  color?: string;
  onClick: (e: React.MouseEvent) => void;
}

export function ReviewDueButton({
  dueCount,
  color,
  onClick,
}: ReviewDueButtonProps) {
  if (dueCount === 0) return null;

  const safeColor =
    color && color in SUBJECT_CONSTANTS.COLOR_GRADIENTS
      ? color
      : SUBJECT_CONSTANTS.DEFAULT_COLOR;
  const colorClasses =
    SUBJECT_CONSTANTS.COLOR_GRADIENTS[
      safeColor as keyof typeof SUBJECT_CONSTANTS.COLOR_GRADIENTS
    ];

  return (
    <button
      onClick={e => {
        e.stopPropagation();
        onClick(e);
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
        'text-xs font-medium transition-all',
        'border hover:shadow-sm',
        colorClasses.icon,
        colorClasses.iconColor,
        colorClasses.border
      )}
    >
      <Brain className="w-3.5 h-3.5" />
      <span>{dueCount} due</span>
    </button>
  );
}
