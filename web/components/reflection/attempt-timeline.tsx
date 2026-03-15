'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ATTEMPT_CONSTANTS } from '@/lib/constants';
import { Attempt, ErrorCategorisation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import AttemptTimelineEntry from './attempt-timeline-entry';

interface AttemptTimelineProps {
  problemId: string;
  refreshKey?: number;
}

const PAGE_SIZE = ATTEMPT_CONSTANTS.TIMELINE_PAGE_SIZE;

function formatRelativeShort(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 1) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

/**
 * Batch-fetch categorisations for a list of attempt IDs.
 * Returns a map of attemptId → ErrorCategorisation.
 */
async function fetchCategorisationsForIds(
  ids: string[]
): Promise<Record<string, ErrorCategorisation>> {
  if (ids.length === 0) return {};

  const results = await Promise.all(
    ids.map(async id => {
      try {
        const res = await fetch(
          `/api/ai/categorise-error?attempt_id=${encodeURIComponent(id)}`
        );
        if (res.ok) {
          const json = await res.json();
          return json.data
            ? { id, data: json.data as ErrorCategorisation }
            : null;
        }
      } catch {
        // Silently fail — categorisation is optional
      }
      return null;
    })
  );

  const map: Record<string, ErrorCategorisation> = {};
  for (const r of results) {
    if (r) map[r.id] = r.data;
  }
  return map;
}

export default function AttemptTimeline({
  problemId,
  refreshKey = 0,
}: AttemptTimelineProps) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [categorisations, setCategorisations] = useState<
    Record<string, ErrorCategorisation>
  >({});
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  /**
   * Return eligible (wrong/needs_review) attempt IDs from a slice,
   * excluding any already in the categorisation cache.
   */
  const getUncachedEligibleIds = useCallback(
    (slice: Attempt[]) =>
      slice
        .filter(
          a =>
            (a.selected_status === 'wrong' ||
              a.selected_status === 'needs_review') &&
            !categorisations[a.id]
        )
        .map(a => a.id),
    [categorisations]
  );

  const fetchAttempts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/attempts?problem_id=${encodeURIComponent(problemId)}`
      );
      if (res.ok) {
        const json = await res.json();
        const fetched: Attempt[] = json.data || [];
        setAttempts(fetched);

        // Only fetch categorisations for the initial visible page
        const initialSlice = fetched.slice(0, PAGE_SIZE);
        const eligibleIds = initialSlice
          .filter(
            a =>
              a.selected_status === 'wrong' ||
              a.selected_status === 'needs_review'
          )
          .map(a => a.id);

        const catMap = await fetchCategorisationsForIds(eligibleIds);
        setCategorisations(catMap);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    fetchAttempts();
  }, [fetchAttempts, refreshKey]);

  const handleShowMore = useCallback(async () => {
    const newCount = Math.min(visibleCount + PAGE_SIZE, attempts.length);
    const newSlice = attempts.slice(visibleCount, newCount);
    const idsToFetch = getUncachedEligibleIds(newSlice);

    if (idsToFetch.length > 0) {
      setIsLoadingMore(true);
      const newCats = await fetchCategorisationsForIds(idsToFetch);
      setCategorisations(prev => ({ ...prev, ...newCats }));
      setIsLoadingMore(false);
    }

    setVisibleCount(newCount);
  }, [visibleCount, attempts, getUncachedEligibleIds]);

  if (isLoading && attempts.length === 0) {
    return (
      <div className="review-section-violet">
        <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-100 mb-1">
          Attempt History
        </h3>
        <span className="text-xs text-muted-foreground">
          Loading attempts...
        </span>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="review-section-violet">
        <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-100 mb-1">
          Attempt History
        </h3>
        <span className="text-xs text-muted-foreground">No attempts yet</span>
      </div>
    );
  }

  const lastAttempt = attempts[0];
  const visibleAttempts = attempts.slice(0, visibleCount);
  const hasMore = visibleCount < attempts.length;
  const remaining = attempts.length - visibleCount;

  return (
    <div className="review-section-violet">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-100">
              Attempt History
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
                {' \u00B7 '}Last: {formatRelativeShort(lastAttempt.created_at)}
              </span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <div className="mt-4 pl-1">
            {visibleAttempts.map((attempt, i) => (
              <AttemptTimelineEntry
                key={attempt.id}
                attempt={attempt}
                isLast={!hasMore && i === visibleAttempts.length - 1}
                onUpdated={fetchAttempts}
                initialCategorisation={categorisations[attempt.id]}
              />
            ))}
            {hasMore && (
              <div className="flex justify-center pt-1 pb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                  onClick={handleShowMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore
                    ? 'Loading...'
                    : `Show ${Math.min(PAGE_SIZE, remaining)} older attempt${Math.min(PAGE_SIZE, remaining) !== 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
