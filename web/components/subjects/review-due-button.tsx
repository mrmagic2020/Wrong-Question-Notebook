'use client';

import { cn } from '@/lib/utils';
import { SUBJECT_CONSTANTS } from '@/lib/constants';
import { Brain, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('Subjects');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [svgDims, setSvgDims] = useState<{ w: number; h: number } | null>(null);

  const safeColor =
    color && color in SUBJECT_CONSTANTS.COLOR_GRADIENTS
      ? color
      : SUBJECT_CONSTANTS.DEFAULT_COLOR;
  const colorClasses =
    SUBJECT_CONSTANTS.COLOR_GRADIENTS[
      safeColor as keyof typeof SUBJECT_CONSTANTS.COLOR_GRADIENTS
    ];

  useEffect(() => {
    if (!buttonRef.current) return;
    const pad = 3; // 1.5px offset on each side
    setSvgDims({
      w: buttonRef.current.offsetWidth + pad,
      h: buttonRef.current.offsetHeight + pad,
    });
  }, [dueCount]);

  if (dueCount === 0) return null;

  return (
    <button
      ref={buttonRef}
      onClick={e => {
        e.stopPropagation();
        onClick(e);
      }}
      className={cn(
        'review-due-btn',
        'group inline-flex items-center gap-1.5 rounded-full px-3 py-1',
        'text-xs font-semibold transition-all duration-200',
        'border shadow-sm',
        'hover:shadow-md hover:scale-105 active:scale-100',
        colorClasses.icon,
        colorClasses.iconColor,
        colorClasses.border
      )}
    >
      <Brain className="w-3.5 h-3.5" />
      <span>
        {dueCount} {t('due')}
      </span>
      <ChevronRight className="w-3 h-3 opacity-60 -ml-0.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      {svgDims && (
        <svg
          className="absolute top-[-1.5px] left-[-1.5px] pointer-events-none"
          width={svgDims.w}
          height={svgDims.h}
          fill="none"
        >
          <rect
            x="0.75"
            y="0.75"
            width={svgDims.w - 1.5}
            height={svgDims.h - 1.5}
            rx={(svgDims.h - 1.5) / 2}
            stroke="currentColor"
            strokeWidth="1.5"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset="100"
            className="review-due-trace"
          />
        </svg>
      )}
    </button>
  );
}
