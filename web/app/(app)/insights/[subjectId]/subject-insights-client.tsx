'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lightbulb,
  Layers,
  TrendingUp,
  MessageSquareText,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { InsightDigest, TopicCluster } from '@/lib/types';

interface SubjectInsightsClientProps {
  subject: { id: string; name: string; color: string | null };
  digest: InsightDigest | null;
}

export default function SubjectInsightsClient({
  subject,
  digest,
}: SubjectInsightsClientProps) {
  const router = useRouter();
  const [reviewingCluster, setReviewingCluster] = useState<string | null>(null);

  const topicClusters: TopicCluster[] =
    digest?.topic_clusters?.[subject.id] ?? [];
  const progressNarrative = digest?.progress_narratives?.[subject.id] ?? null;
  const errorPatternSummary = digest?.error_pattern_summary ?? null;
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
    <div className="page-container max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Back link */}
        <Link
          href="/insights"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Insights
        </Link>

        {/* Subject Header */}
        <div className="page-header">
          <h1 className="page-title flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: subject.color
                  ? `${subject.color}1a`
                  : undefined,
              }}
            >
              <Lightbulb
                className="h-5 w-5"
                style={{ color: subject.color || undefined }}
              />
            </span>
            {subject.name} Insights
          </h1>
          <p className="page-description">
            Detailed analysis for {subject.name}.
          </p>
        </div>

        {/* No digest or no data */}
        {!digest || !hasData ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-orange-200/40 bg-gradient-to-br from-orange-50 to-amber-50/50 p-12 text-center dark:border-orange-800/30 dark:from-orange-950/40 dark:to-amber-900/20">
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
            {/* Weak Spots for this subject */}
            {weakSpots.length > 0 && (
              <section className="space-y-4">
                <h2 className="heading-sm text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  Weak Spots
                </h2>
                <div className="space-y-3">
                  {weakSpots.map((ws, i) => (
                    <div
                      key={`${ws.topic_label}-${i}`}
                      className="rounded-xl border border-rose-200/40 bg-gradient-to-br from-rose-50/50 to-white p-4 dark:border-rose-800/30 dark:from-rose-950/30 dark:to-gray-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {ws.topic_label}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {ws.trend_phrase}
                          </p>
                          <span className="inline-flex items-center rounded-full bg-rose-100/80 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                            {ws.dominant_error_type}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reviewingCluster === ws.topic_label}
                          onClick={() =>
                            handleReview(ws.problem_ids, ws.topic_label)
                          }
                          className="shrink-0 rounded-xl border-rose-200/50 text-rose-600 hover:bg-rose-50 dark:border-rose-800/40 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        >
                          {reviewingCluster === ws.topic_label ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="mr-2 h-4 w-4" />
                          )}
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Topic Clusters */}
            {topicClusters.length > 0 && (
              <section className="space-y-4">
                <h2 className="heading-sm text-foreground flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Topic Clusters
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {topicClusters.map(cluster => {
                    const total = cluster.problem_count;
                    const masteredPct =
                      total > 0
                        ? Math.round((cluster.mastered_count / total) * 100)
                        : 0;
                    const isReviewing = reviewingCluster === cluster.label;

                    return (
                      <div
                        key={cluster.label}
                        className="rounded-2xl border border-blue-200/40 bg-gradient-to-br from-blue-50/50 to-white p-5 dark:border-blue-800/30 dark:from-blue-950/30 dark:to-gray-900"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {cluster.label}
                            </h3>
                            <span className="shrink-0 rounded-full bg-blue-100/80 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
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

                          {cluster.problem_ids.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isReviewing}
                              onClick={() =>
                                handleReview(cluster.problem_ids, cluster.label)
                              }
                              className="w-full rounded-xl border-blue-200/50 text-blue-600 hover:bg-blue-50 dark:border-blue-800/40 dark:text-blue-400 dark:hover:bg-blue-950/30"
                            >
                              {isReviewing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowRight className="mr-2 h-4 w-4" />
                              )}
                              Review Cluster
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Error Pattern Summary */}
            {errorPatternSummary && (
              <section className="space-y-4">
                <h2 className="heading-sm text-foreground flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  Error Pattern Summary
                </h2>
                <div className="rounded-2xl border border-amber-200/40 bg-gradient-to-br from-amber-50/50 to-white p-5 dark:border-amber-800/30 dark:from-amber-950/30 dark:to-gray-900">
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {errorPatternSummary}
                  </p>
                </div>
              </section>
            )}

            {/* Progress Narrative */}
            {progressNarrative && (
              <section className="space-y-4">
                <h2 className="heading-sm text-foreground flex items-center gap-2">
                  <MessageSquareText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Progress Narrative
                </h2>
                <div className="rounded-2xl border border-green-200/40 bg-gradient-to-br from-green-50/50 to-white p-5 dark:border-green-800/30 dark:from-green-950/30 dark:to-gray-900">
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {progressNarrative}
                  </p>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
