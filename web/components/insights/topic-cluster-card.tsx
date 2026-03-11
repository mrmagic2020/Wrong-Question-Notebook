'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { TopicCluster } from '@/lib/types';
import { MasteryStatusBar } from './mastery-status-bar';

interface TopicClusterCardProps {
  cluster: TopicCluster;
  subjectId: string;
  onReview: (subjectId: string, problemIds: string[]) => void;
}

export function TopicClusterCard({
  cluster,
  subjectId,
  onReview,
}: TopicClusterCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-gradient-to-br p-5 space-y-4',
        'from-white to-gray-50/50',
        'border-gray-200/40',
        'dark:from-gray-800/40 dark:to-gray-900/20',
        'dark:border-gray-700/30'
      )}
    >
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {cluster.label}
        </h4>

        <MasteryStatusBar
          wrong={cluster.wrong_count}
          needsReview={cluster.needs_review_count}
          mastered={cluster.mastered_count}
        />

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {cluster.problem_count}{' '}
          {cluster.problem_count === 1 ? 'problem' : 'problems'}
          {cluster.wrong_count > 0 && (
            <span className="text-red-600 dark:text-red-400">
              {' '}
              &middot; {cluster.wrong_count} Wrong
            </span>
          )}
          {cluster.needs_review_count > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {' '}
              &middot; {cluster.needs_review_count} Needs Review
            </span>
          )}
          {cluster.mastered_count > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400">
              {' '}
              &middot; {cluster.mastered_count} Mastered
            </span>
          )}
        </p>
      </div>

      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {cluster.narrative}
      </p>

      <Button
        variant="outline"
        size="sm"
        className="rounded-xl text-xs"
        onClick={() => onReview(subjectId, cluster.problem_ids)}
      >
        Review this topic
      </Button>
    </div>
  );
}
