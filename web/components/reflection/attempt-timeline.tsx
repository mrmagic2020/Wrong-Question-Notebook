'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Attempt } from '@/lib/types';
import AttemptTimelineEntry from './attempt-timeline-entry';

interface AttemptTimelineProps {
  problemId: string;
  refreshKey?: number;
}

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

export default function AttemptTimeline({
  problemId,
  refreshKey = 0,
}: AttemptTimelineProps) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAttempts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/attempts?problem_id=${encodeURIComponent(problemId)}`
      );
      if (res.ok) {
        const json = await res.json();
        setAttempts(json.data || []);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts, refreshKey]);

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
            {attempts.map((attempt, i) => (
              <AttemptTimelineEntry
                key={attempt.id}
                attempt={attempt}
                isLast={i === attempts.length - 1}
                onUpdated={fetchAttempts}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
