'use client';

import { PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorPatternSummaryProps {
  summary: string;
}

export function ErrorPatternSummary({ summary }: ErrorPatternSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'bg-rose-500/10 dark:bg-rose-500/20'
          )}
        >
          <PieChart className="h-4 w-4 text-rose-600 dark:text-rose-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Error Patterns
        </h3>
      </div>
      <div
        className={cn(
          'rounded-2xl border bg-gradient-to-br p-5',
          'from-rose-50/50 to-orange-50/30',
          'border-rose-200/40',
          'dark:from-rose-950/30 dark:to-orange-950/20',
          'dark:border-rose-800/30'
        )}
      >
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {summary}
        </p>
      </div>
    </div>
  );
}
