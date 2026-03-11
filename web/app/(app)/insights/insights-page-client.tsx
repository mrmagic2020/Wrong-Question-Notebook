'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lightbulb,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Loader2,
  TrendingUp,
  FileQuestion,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { InsightDigest, WeakSpot, TopicCluster } from '@/lib/types';

interface InsightsPageClientProps {
  initialDigest: InsightDigest | null;
  subjects: Array<{ id: string; name: string; color: string | null }>;
}

export default function InsightsPageClient({
  initialDigest,
  subjects,
}: InsightsPageClientProps) {
  const router = useRouter();
  const [digest, setDigest] = useState<InsightDigest | null>(initialDigest);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasInsufficientData, setHasInsufficientData] = useState(false);
  const [reviewingSubjectId, setReviewingSubjectId] = useState<string | null>(
    null
  );

  const subjectMap = Object.fromEntries(
    subjects.map(s => [s.id, { name: s.name, color: s.color }])
  );

  async function handleGenerate() {
    setIsGenerating(true);
    setHasInsufficientData(false);
    try {
      const res = await fetch('/api/insights/generate', { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 422 || json?.error === 'insufficient_data') {
          setHasInsufficientData(true);
          return;
        }
        throw new Error(json?.error || 'Failed to generate insights');
      }

      setDigest(json.data ?? json);
      toast.success('Insights generated successfully');
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to generate insights'
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleReview(subjectId: string, problemIds: string[]) {
    setReviewingSubjectId(subjectId);
    try {
      const res = await fetch('/api/review-sessions/start-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          problem_ids: problemIds,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || 'Failed to start review session');
      }

      const sessionId = json.data?.sessionId ?? json.sessionId;
      router.push(`/subjects/${subjectId}/review-due?sessionId=${sessionId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to start review'
      );
    } finally {
      setReviewingSubjectId(null);
    }
  }

  // Empty state: no digest and not generating
  if (!digest && !isGenerating && !hasInsufficientData) {
    return (
      <div className="page-container max-w-4xl mx-auto">
        <div className="space-y-6">
          <PageHeader />
          <EmptyInsightsState
            isGenerating={false}
            hasInsufficientData={false}
            onGenerate={handleGenerate}
          />
        </div>
      </div>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <div className="page-container max-w-4xl mx-auto">
        <div className="space-y-6">
          <PageHeader />
          <EmptyInsightsState
            isGenerating={true}
            hasInsufficientData={false}
            onGenerate={handleGenerate}
          />
        </div>
      </div>
    );
  }

  // Insufficient data state
  if (hasInsufficientData) {
    return (
      <div className="page-container max-w-4xl mx-auto">
        <div className="space-y-6">
          <PageHeader />
          <EmptyInsightsState
            isGenerating={false}
            hasInsufficientData={true}
            onGenerate={handleGenerate}
          />
        </div>
      </div>
    );
  }

  // We have a digest
  const weakSpots = (digest!.weak_spots || []).map(ws => ({
    ...ws,
    subject_color: subjectMap[ws.subject_id]?.color ?? undefined,
    subject_name:
      ws.subject_name || subjectMap[ws.subject_id]?.name || 'Unknown',
  }));

  const subjectHealth = digest!.subject_health || {};

  return (
    <div className="page-container max-w-4xl mx-auto">
      <div className="space-y-6">
        <PageHeader />

        {/* Digest Header */}
        <DigestHeader
          headline={digest!.headline}
          generatedAt={digest!.generated_at}
          onRegenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        {/* Weak Spots */}
        {weakSpots.length > 0 && (
          <WeakSpotsList
            weakSpots={weakSpots}
            onReview={handleReview}
            reviewingSubjectId={reviewingSubjectId}
          />
        )}

        {/* Error Pattern Summary */}
        {digest!.error_pattern_summary && (
          <ErrorPatternSummary summary={digest!.error_pattern_summary} />
        )}

        {/* Subject Overview */}
        {Object.keys(subjectHealth).length > 0 && (
          <section className="space-y-4">
            <h2 className="heading-sm text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Subject Overview
            </h2>
            <div className="space-y-3">
              {Object.entries(subjectHealth).map(
                ([subjectId, healthSummary]) => (
                  <SubjectHealthRow
                    key={subjectId}
                    subjectName={
                      subjectMap[subjectId]?.name || 'Unknown Subject'
                    }
                    subjectColor={subjectMap[subjectId]?.color ?? null}
                    healthSummary={healthSummary}
                    topicClusters={digest!.topic_clusters?.[subjectId]}
                    onViewDetails={() => router.push(`/insights/${subjectId}`)}
                  />
                )
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ===== Sub-components ===== */

function PageHeader() {
  return (
    <div className="page-header">
      <h1 className="page-title flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 dark:bg-orange-500/20">
          <Lightbulb className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </span>
        Insights
      </h1>
      <p className="page-description">
        AI-powered analysis of your error patterns and weak spots.
      </p>
    </div>
  );
}

function EmptyInsightsState({
  isGenerating,
  hasInsufficientData,
  onGenerate,
}: {
  isGenerating: boolean;
  hasInsufficientData: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-orange-200/40 bg-gradient-to-br from-orange-50 to-amber-50/50 p-12 text-center dark:border-orange-800/30 dark:from-orange-950/40 dark:to-amber-900/20">
      {isGenerating ? (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 dark:bg-orange-500/20">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Generating your insights...
          </h3>
          <p className="max-w-sm text-sm text-gray-600 dark:text-gray-400">
            Analyzing your error patterns and identifying weak spots. This may
            take a moment.
          </p>
        </>
      ) : hasInsufficientData ? (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/20">
            <FileQuestion className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Not enough data yet
          </h3>
          <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
            Keep reviewing problems and logging your attempts. We need more data
            to generate meaningful insights for you.
          </p>
          <Button
            variant="outline"
            onClick={onGenerate}
            className="rounded-xl border-amber-200/50 dark:border-amber-800/40"
          >
            Try Again
          </Button>
        </>
      ) : (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 dark:bg-orange-500/20">
            <Sparkles className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            No insights yet
          </h3>
          <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
            Generate your first AI-powered insight digest to discover your weak
            spots and error patterns.
          </p>
          <Button onClick={onGenerate} className="btn-cta-primary">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Insights
          </Button>
        </>
      )}
    </div>
  );
}

function DigestHeader({
  headline,
  generatedAt,
  onRegenerate,
  isGenerating,
}: {
  headline: string;
  generatedAt: string;
  onRegenerate: () => void;
  isGenerating: boolean;
}) {
  const formattedDate = new Date(generatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="rounded-2xl border border-orange-200/40 bg-gradient-to-br from-orange-50 to-amber-50/50 p-6 dark:border-orange-800/30 dark:from-orange-950/40 dark:to-amber-900/20">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {headline}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generated {formattedDate}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="shrink-0 rounded-xl border-orange-200/50 dark:border-orange-800/40"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>
    </div>
  );
}

function WeakSpotsList({
  weakSpots,
  onReview,
  reviewingSubjectId,
}: {
  weakSpots: WeakSpot[];
  onReview: (subjectId: string, problemIds: string[]) => void;
  reviewingSubjectId: string | null;
}) {
  return (
    <section className="space-y-4">
      <h2 className="heading-sm text-foreground flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        Weak Spots
      </h2>
      <div className="space-y-3">
        {weakSpots.map((ws, i) => {
          const isReviewing = reviewingSubjectId === ws.subject_id;

          return (
            <div
              key={`${ws.topic_label}-${i}`}
              className="rounded-xl border border-rose-200/40 bg-gradient-to-br from-rose-50/50 to-white p-4 dark:border-rose-800/30 dark:from-rose-950/30 dark:to-gray-900"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: ws.subject_color || undefined,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {ws.topic_label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {ws.subject_name} &middot; {ws.problem_count} problem
                    {ws.problem_count !== 1 ? 's' : ''}
                  </p>
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
                  disabled={isReviewing}
                  onClick={() => onReview(ws.subject_id, ws.problem_ids)}
                  className="shrink-0 rounded-xl border-rose-200/50 text-rose-600 hover:bg-rose-50 dark:border-rose-800/40 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  {isReviewing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Review
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ErrorPatternSummary({ summary }: { summary: string }) {
  return (
    <section className="space-y-4">
      <h2 className="heading-sm text-foreground flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        Error Pattern Summary
      </h2>
      <div className="rounded-2xl border border-amber-200/40 bg-gradient-to-br from-amber-50/50 to-white p-5 dark:border-amber-800/30 dark:from-amber-950/30 dark:to-gray-900">
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {summary}
        </p>
      </div>
    </section>
  );
}

function SubjectHealthRow({
  subjectName,
  subjectColor,
  healthSummary,
  topicClusters,
  onViewDetails,
}: {
  subjectName: string;
  subjectColor: string | null;
  healthSummary: string;
  topicClusters?: TopicCluster[];
  onViewDetails: () => void;
}) {
  const clusterCount = topicClusters?.length ?? 0;

  return (
    <div className="rounded-2xl border border-blue-200/40 bg-gradient-to-br from-blue-50/50 to-white p-5 dark:border-blue-800/30 dark:from-blue-950/30 dark:to-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {subjectColor && (
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: subjectColor }}
              />
            )}
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {subjectName}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {healthSummary}
          </p>
          {clusterCount > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {clusterCount} topic cluster{clusterCount !== 1 ? 's' : ''}{' '}
              identified
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onViewDetails}
          className="shrink-0 rounded-xl border-blue-200/50 text-blue-600 hover:bg-blue-50 dark:border-blue-800/40 dark:text-blue-400 dark:hover:bg-blue-950/30"
        >
          Details
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
