'use client';

import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TopicCluster } from '@/lib/types';
import { TopicClusterCard } from './topic-cluster-card';

interface TopicClusterMapProps {
  clusters: TopicCluster[];
  subjectId: string;
  onReview: (subjectId: string, problemIds: string[]) => void;
}

export function TopicClusterMap({
  clusters,
  subjectId,
  onReview,
}: TopicClusterMapProps) {
  const sorted = [...clusters].sort((a, b) => b.wrong_count - a.wrong_count);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'bg-blue-500/10 dark:bg-blue-500/20'
          )}
        >
          <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Topic Clusters
        </h3>
        {clusters.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({clusters.length})
          </span>
        )}
      </div>

      <div className="grid gap-3">
        {sorted.map(cluster => (
          <TopicClusterCard
            key={cluster.label}
            cluster={cluster}
            subjectId={subjectId}
            onReview={onReview}
          />
        ))}
      </div>
    </div>
  );
}
