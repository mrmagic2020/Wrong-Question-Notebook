'use client';

import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressNarrativeProps {
  narrative: string;
}

export function ProgressNarrative({ narrative }: ProgressNarrativeProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'bg-emerald-500/10 dark:bg-emerald-500/20'
          )}
        >
          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Progress
        </h3>
      </div>
      <div
        className={cn(
          'rounded-2xl border bg-gradient-to-br p-5',
          'from-emerald-50/50 to-teal-50/30',
          'border-emerald-200/40',
          'dark:from-emerald-950/30 dark:to-teal-950/20',
          'dark:border-emerald-800/30'
        )}
      >
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {narrative}
        </p>
      </div>
    </div>
  );
}
