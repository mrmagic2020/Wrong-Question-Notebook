'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lightbulb,
  Layers,
  TrendingUp,
  MessageSquareText,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { BackLink } from '@/components/back-link';
import { PageHeader } from '@/components/page-header';
import type { InsightDigest, TopicCluster } from '@/lib/types';
import { SUBJECT_CONSTANTS } from '@/lib/constants';

interface ReviewSessionSummary {
  id: string;
  is_active: boolean;
  problem_ids: string[];
}

type ReviewState = 'review' | 'resume';

function getReviewState(
  problemIds: string[],
  sessions: ReviewSessionSummary[]
): ReviewState {
  const key = [...problemIds].sort().join(',');
  if (sessions.some(s => s.is_active && s.problem_ids.join(',') === key)) {
    return 'resume';
  }
  return 'review';
}

interface SubjectInsightsClientProps {
  subject: { id: string; name: string; color: string | null };
  digest: InsightDigest | null;
  reviewSessions: ReviewSessionSummary[];
}

export default function SubjectInsightsClient({
  subject,
  digest,
  reviewSessions,
}: SubjectInsightsClientProps) {
  const router = useRouter();
  const [reviewingCluster, setReviewingCluster] = useState<string | null>(null);

  const safeColor =
    subject.color && subject.color in SUBJECT_CONSTANTS.COLOR_GRADIENTS
      ? subject.color
      : SUBJECT_CONSTANTS.DEFAULT_COLOR;
  const colorClasses =
    SUBJECT_CONSTANTS.COLOR_GRADIENTS[
      safeColor as keyof typeof SUBJECT_CONSTANTS.COLOR_GRADIENTS
    ];

  const topicClusters: TopicCluster[] =
    digest?.topic_clusters?.[subject.id] ?? [];
  const progressNarrative = digest?.progress_narratives?.[subject.id] ?? null;
  const errorPatternSummary =
    digest?.subject_error_patterns?.[subject.id] ??
    digest?.error_pattern_summary ??
    null;
  const weakSpots = (digest?.weak_spots ?? []).filter(
    ws => ws.subject_id === subject.id
  );

  const hasData =
    topicClusters.length > 0 || progressNarrative || weakSpots.length > 0;

  async function handleReview(problemIds: string[], clusterLabel: string) {
    setReviewingCluster(clusterLabel);
    try {
      const res = await fetch('/api/review-sessions/start-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subject.id,
          problem_ids: problemIds,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to start review session');
      }

      const sessionId = json.data?.sessionId ?? json.sessionId;
      router.push(`/subjects/${subject.id}/review-due?sessionId=${sessionId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to start review'
      );
    } finally {
      setReviewingCluster(null);
    }
  }

  return (
    <div className="section-container">
      <PageHeader
        title={`${subject.name} Insights`}
        description={`Detailed analysis for ${subject.name}.`}
        actions={<BackLink href="/insights">Back to Insights</BackLink>}
      />

      {/* No digest or no data */}
      {!digest || !hasData ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-orange-200/40 bg-orange-50/50 p-12 text-center dark:border-orange-800/30 dark:bg-orange-950/30">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 dark:bg-orange-500/20">
            <Lightbulb className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            No insights for this subject yet
          </h3>
          <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
            Generate insights from the main Insights page to see detailed
            analysis for {subject.name}.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push('/insights')}
            className="rounded-xl border-orange-200/50 dark:border-orange-800/40"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Insights
          </Button>
        </div>
      ) : (
        <>
          {/* Error Pattern + Progress Narrative */}
          {(errorPatternSummary || progressNarrative) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {errorPatternSummary && (
                <div className="rounded-2xl border border-amber-200/40 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-5 dark:border-amber-800/30 dark:from-amber-950/20 dark:to-orange-950/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/20">
                      <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Error Pattern Summary
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {errorPatternSummary}
                  </p>
                </div>
              )}
              {progressNarrative && (
                <div className="rounded-2xl border border-green-200/40 bg-gradient-to-br from-green-50/50 to-emerald-50/30 p-5 dark:border-green-800/30 dark:from-green-950/20 dark:to-emerald-950/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 dark:bg-green-500/20">
                      <MessageSquareText className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Progress Narrative
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {progressNarrative}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Weak Spots */}
          {weakSpots.length > 0 && (
            <section className="space-y-4">
              <h2 className="heading-sm text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                Weak Spots
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {weakSpots.map((ws, i) => {
                  const state = getReviewState(ws.problem_ids, reviewSessions);
                  return (
                    <div
                      key={`${ws.topic_label}-${i}`}
                      className="rounded-2xl border border-rose-200/40 bg-gradient-to-br from-rose-50/30 to-rose-100/20 p-4 dark:border-rose-800/30 dark:from-rose-950/20 dark:to-rose-900/10"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {ws.topic_label}
                          </h3>
                          <span className="inline-flex shrink-0 items-center rounded-full bg-rose-100/80 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                            {ws.dominant_error_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {ws.trend_phrase}
                        </p>
                        <ReviewButton
                          state={state}
                          isLoading={reviewingCluster === ws.topic_label}
                          onClick={() =>
                            handleReview(ws.problem_ids, ws.topic_label)
                          }
                          colorClassName="border-rose-200/50 text-rose-600 hover:bg-rose-50 dark:border-rose-800/40 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          fullWidth
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Topic Clusters */}
          {topicClusters.length > 0 && (
            <section className="space-y-4">
              <h2 className="heading-sm text-foreground flex items-center gap-2">
                <Layers className={`h-5 w-5 ${colorClasses.iconColor}`} />
                Topic Clusters
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topicClusters.map(cluster => {
                  const total = cluster.problem_count;
                  const masteredPct =
                    total > 0
                      ? Math.round((cluster.mastered_count / total) * 100)
                      : 0;
                  const isReviewing = reviewingCluster === cluster.label;
                  const state = getReviewState(
                    cluster.problem_ids,
                    reviewSessions
                  );

                  return (
                    <div
                      key={cluster.label}
                      className={`grid grid-rows-subgrid row-span-4 gap-3 rounded-2xl border p-5 ${colorClasses.border} ${colorClasses.cardBg}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {cluster.label}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${colorClasses.badge}`}
                        >
                          {total} problem{total !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          {cluster.mastered_count > 0 && (
                            <div
                              className="bg-emerald-500"
                              style={{
                                width: `${(cluster.mastered_count / total) * 100}%`,
                              }}
                            />
                          )}
                          {cluster.needs_review_count > 0 && (
                            <div
                              className="bg-amber-500"
                              style={{
                                width: `${(cluster.needs_review_count / total) * 100}%`,
                              }}
                            />
                          )}
                          {cluster.wrong_count > 0 && (
                            <div
                              className="bg-rose-500"
                              style={{
                                width: `${(cluster.wrong_count / total) * 100}%`,
                              }}
                            />
                          )}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{masteredPct}% mastered</span>
                          <span>{cluster.wrong_count} wrong</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {cluster.narrative}
                      </p>

                      <div className="self-end">
                        {cluster.problem_ids.length > 0 && (
                          <ReviewButton
                            state={state}
                            isLoading={isReviewing}
                            onClick={() =>
                              handleReview(cluster.problem_ids, cluster.label)
                            }
                            colorClassName={`${colorClasses.border} ${colorClasses.iconColor} ${colorClasses.buttonHover}`}
                            fullWidth
                            label={
                              state === 'resume'
                                ? 'Resume Cluster'
                                : 'Review Cluster'
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ReviewButton({
  state,
  isLoading,
  onClick,
  colorClassName,
  fullWidth,
  label,
}: {
  state: ReviewState;
  isLoading: boolean;
  onClick: () => void;
  colorClassName: string;
  fullWidth?: boolean;
  label?: string;
}) {
  const defaultLabel = state === 'resume' ? 'Resume' : 'Review';

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isLoading}
      onClick={onClick}
      className={`${fullWidth ? 'w-full' : 'shrink-0'} rounded-xl ${colorClassName}`}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : state === 'resume' ? (
        <Play className="mr-2 h-4 w-4" />
      ) : (
        <ArrowRight className="mr-2 h-4 w-4" />
      )}
      {label ?? defaultLabel}
    </Button>
  );
}
