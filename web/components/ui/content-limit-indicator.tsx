'use client';

import { CONTENT_LIMIT_CONSTANTS } from '@/lib/constants';

const { WARNING_THRESHOLD } = CONTENT_LIMIT_CONSTANTS;

interface ContentLimitIndicatorProps {
  current: number;
  limit: number;
  label?: string;
  formatValue?: (n: number) => string;
  className?: string;
}

export function ContentLimitIndicator({
  current,
  limit,
  label,
  formatValue,
  className = '',
}: ContentLimitIndicatorProps) {
  const ratio = limit > 0 ? current / limit : 0;
  const isWarning = ratio >= WARNING_THRESHOLD && ratio < 1;
  const isExhausted = current >= limit;

  const colorClass = isExhausted
    ? 'text-rose-600 dark:text-rose-400'
    : isWarning
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-gray-500 dark:text-gray-400';

  const fmt = formatValue ?? ((n: number) => String(n));

  return (
    <p className={`text-xs ${colorClass} ${className}`}>
      {fmt(current)} of {fmt(limit)} {label ?? 'used'}
    </p>
  );
}
