'use client';

import { useState } from 'react';
import { Target, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { INSIGHT_CONSTANTS } from '@/lib/constants';
import type { WeakSpot } from '@/lib/types';
import { WeakSpotCard } from './weak-spot-card';

interface WeakSpotsListProps {
  weakSpots: WeakSpot[];
  onReview: (subjectId: string, problemIds: string[]) => void;
}

export function WeakSpotsList({ weakSpots, onReview }: WeakSpotsListProps) {
  const [showAll, setShowAll] = useState(false);

  const hasMore = weakSpots.length > INSIGHT_CONSTANTS.MAX_WEAK_SPOTS_OVERVIEW;
  const visibleSpots = showAll
    ? weakSpots
    : weakSpots.slice(0, INSIGHT_CONSTANTS.MAX_WEAK_SPOTS_OVERVIEW);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'bg-orange-500/10 dark:bg-orange-500/20'
          )}
        >
          <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Weak Spots
        </h3>
        {weakSpots.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({weakSpots.length})
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visibleSpots.map(spot => (
          <WeakSpotCard
            key={`${spot.subject_id}-${spot.topic_label}`}
            weakSpot={spot}
            onReview={onReview}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                Show less <ChevronUp className="ml-1 h-3 w-3" />
              </>
            ) : (
              <>
                Show all {weakSpots.length}{' '}
                <ChevronDown className="ml-1 h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
