'use client';

import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DigestHeaderProps {
  headline: string;
  generatedAt: string;
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const generated = new Date(dateString);
  const diffMs = now.getTime() - generated.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Updated just now';
  if (diffMinutes < 60) return `Updated ${diffMinutes} minutes ago`;
  if (diffHours < 2) return 'Updated 1 hour ago';
  if (diffHours < 12) return `Updated ${diffHours} hours ago`;
  if (diffHours < 18) return 'Updated this morning';
  if (diffDays < 1) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  return `Updated ${diffDays} days ago`;
}

export function DigestHeader({ headline, generatedAt }: DigestHeaderProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-gradient-to-br p-6',
        'from-amber-50 to-orange-50/50',
        'border-amber-200/40',
        'dark:from-amber-950/40 dark:to-orange-950/20',
        'dark:border-amber-800/30'
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            'bg-amber-500/10 dark:bg-amber-500/20'
          )}
        >
          <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {headline}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatRelativeTime(generatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
