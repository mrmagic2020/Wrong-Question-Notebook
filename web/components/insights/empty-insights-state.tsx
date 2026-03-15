'use client';

import { NotebookPen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyInsightsStateProps {
  isGenerating?: boolean;
  hasInsufficientData?: boolean;
}

export function EmptyInsightsState({
  isGenerating,
  hasInsufficientData,
}: EmptyInsightsStateProps) {
  if (isGenerating) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border p-10 text-center',
          'bg-gradient-to-br from-amber-50/50 to-orange-50/30',
          'border-amber-200/40',
          'dark:from-amber-950/30 dark:to-orange-950/20',
          'dark:border-amber-800/30'
        )}
      >
        <div
          className={cn(
            'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
            'bg-amber-500/10 dark:bg-amber-500/20'
          )}
        >
          <Loader2 className="h-7 w-7 animate-spin text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Generating your first study briefing...
        </h3>
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          We&apos;re analysing your problems and attempts to create personalised
          insights. This usually takes a few moments.
        </p>
      </div>
    );
  }

  if (hasInsufficientData) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border p-10 text-center',
          'bg-gradient-to-br from-amber-50/50 to-orange-50/30',
          'border-amber-200/40',
          'dark:from-amber-950/30 dark:to-orange-950/20',
          'dark:border-amber-800/30'
        )}
      >
        <div
          className={cn(
            'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
            'bg-amber-500/10 dark:bg-amber-500/20'
          )}
        >
          <NotebookPen className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Keep going, you&apos;re building momentum!
        </h3>
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Log a few more problems and review them to unlock personalised
          insights. We need a bit more data to spot your patterns and highlight
          areas to focus on.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border p-10 text-center',
        'bg-gradient-to-br from-amber-50/50 to-orange-50/30',
        'border-amber-200/40',
        'dark:from-amber-950/30 dark:to-orange-950/20',
        'dark:border-amber-800/30'
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
          'bg-amber-500/10 dark:bg-amber-500/20'
        )}
      >
        <NotebookPen className="h-7 w-7 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        No insights yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Start logging your wrong answers and reviewing problems to generate
        AI-powered study insights.
      </p>
    </div>
  );
}
