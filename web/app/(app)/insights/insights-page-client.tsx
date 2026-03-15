'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import type { ActivitySummary, InsightDigest, TopicCluster } from '@/lib/types';
import { SUBJECT_CONSTANTS, INSIGHT_CONSTANTS } from '@/lib/constants';

interface InsightsPageClientProps {
  initialDigest: InsightDigest | null;
  initialIsGenerating?: boolean;
  subjects: Array<{ id: string; name: string; color: string | null }>;
}

export default function InsightsPageClient({
  initialDigest,
  initialIsGenerating = false,
  subjects,
}: InsightsPageClientProps) {
  const router = useRouter();
  const [digest, setDigest] = useState<InsightDigest | null>(initialDigest);
  const [isGenerating, setIsGenerating] = useState(initialIsGenerating);
  const [hasInsufficientData, setHasInsufficientData] = useState(false);
  const [activityProgress, setActivityProgress] = useState<{
    activity: ActivitySummary;
    activity_needed: number;
    errors_needed: number;
  } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const subjectMap = Object.fromEntries(
    subjects.map(s => [s.id, { name: s.name, color: s.color }])
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      pollCountRef.current++;
      if (pollCountRef.current > INSIGHT_CONSTANTS.MAX_POLL_ATTEMPTS) {
        setIsGenerating(false);
        stopPolling();
        toast.error(
          'Insights generation is taking too long. Please try again later.'
        );
        return;
      }

      try {
        const res = await fetch('/api/insights/status');
        const json = await res.json();
        const data = json.data ?? json;

        if (data.status === 'completed' && data.digest) {
          setDigest(data.digest);
          setIsGenerating(false);
          stopPolling();
          toast.success('Insights generated successfully');
        } else if (data.status === 'failed' || data.status === 'none') {
          setIsGenerating(false);
          stopPolling();
          toast.error('Insights generation failed. Please try again.');
        }
        // 'generating' → keep polling
      } catch {
        // Network error — keep polling
      }
    }, INSIGHT_CONSTANTS.GENERATION_POLL_INTERVAL_MS);
  }, [stopPolling]);

  // Start polling on mount if generation is in progress
  useEffect(() => {
    if (isGenerating) {
      startPolling();
    }
    return stopPolling;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-compute weak spot counts (must be before early returns for hook rules)
  const weakSpotCountBySubject = useMemo(() => {
    const spots = digest?.weak_spots || [];
    const counts: Record<string, number> = {};
    for (const ws of spots) {
      counts[ws.subject_id] = (counts[ws.subject_id] ?? 0) + 1;
    }
    return counts;
  }, [digest]);

  async function handleGenerate() {
    setIsGenerating(true);
    setHasInsufficientData(false);
    setActivityProgress(null);
    try {
      const res = await fetch('/api/insights/generate', { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Already generating — start polling
          startPolling();
          return;
        }
        throw new Error(json?.error || 'Failed to generate insights');
      }

      const data = json.data ?? json;
      if (data.insufficient_data) {
        setHasInsufficientData(true);
        setActivityProgress({
          activity: data.activity,
          activity_needed: data.activity_needed,
          errors_needed: data.errors_needed,
        });
        setIsGenerating(false);
        return;
      }

      // Check if the API returned a cached digest due to cooldown
      if (json.message && digest && data.id === digest.id) {
        setIsGenerating(false);
        toast.info('Insights were generated recently. Try again later.');
        return;
      }

      setDigest(data);
      setIsGenerating(false);
      toast.success('Insights generated successfully');
      router.refresh();
    } catch (err) {
      setIsGenerating(false);
      toast.error(
        err instanceof Error ? err.message : 'Failed to generate insights'
      );
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
            activityProgress={activityProgress}
          />
        </div>
      </div>
    );
  }

  // We have a digest
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
          digestTier={digest!.digest_tier}
        />

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
                    weakSpotCount={weakSpotCountBySubject[subjectId] ?? 0}
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

function ProgressBar({
  label,
  current,
  target,
  met,
}: {
  label: string;
  current: number;
  target: number;
  met: boolean;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="w-full max-w-xs space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span
          className={
            met
              ? 'font-medium text-green-600 dark:text-green-400'
              : 'font-medium text-amber-600 dark:text-amber-400'
          }
        >
          {current} / {target}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-2 rounded-full transition-all ${
            met
              ? 'bg-green-500 dark:bg-green-400'
              : 'bg-amber-500 dark:bg-amber-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EmptyInsightsState({
  isGenerating,
  hasInsufficientData,
  onGenerate,
  activityProgress,
}: {
  isGenerating: boolean;
  hasInsufficientData: boolean;
  onGenerate: () => void;
  activityProgress?: {
    activity: ActivitySummary;
    activity_needed: number;
    errors_needed: number;
  } | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-orange-200/40 bg-orange-50/50 p-12 text-center dark:border-orange-800/30 dark:bg-orange-950/30">
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
            {activityProgress ? 'Almost there!' : 'Not enough data yet'}
          </h3>
          {activityProgress ? (
            <div className="mb-6 flex flex-col items-center gap-3 pt-2">
              <ProgressBar
                label="Problems attempted"
                current={activityProgress.activity.total_problems}
                target={INSIGHT_CONSTANTS.MIN_ACTIVITY_FOR_INSIGHTS}
                met={activityProgress.activity_needed === 0}
              />
              <ProgressBar
                label="Errors to analyse"
                current={activityProgress.activity.problems_with_errors}
                target={INSIGHT_CONSTANTS.MIN_ERRORS_FOR_FULL_DIGEST}
                met={activityProgress.errors_needed === 0}
              />
              <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                {activityProgress.activity_needed > 0 &&
                activityProgress.errors_needed > 0
                  ? `Attempt ${activityProgress.activity_needed} more problem${activityProgress.activity_needed === 1 ? '' : 's'} to unlock insights.`
                  : activityProgress.activity_needed > 0
                    ? `Attempt ${activityProgress.activity_needed} more problem${activityProgress.activity_needed === 1 ? '' : 's'} to unlock insights.`
                    : `Log ${activityProgress.errors_needed} more wrong answer${activityProgress.errors_needed === 1 ? '' : 's'} for error analysis.`}
              </p>
            </div>
          ) : (
            <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
              Keep reviewing problems and logging your attempts. We need more
              data to generate meaningful insights for you.
            </p>
          )}
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
  digestTier,
}: {
  headline: string;
  generatedAt: string;
  onRegenerate: () => void;
  isGenerating: boolean;
  digestTier?: string;
}) {
  const formattedDate = new Date(generatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="rounded-2xl border border-orange-200/40 bg-orange-50/50 p-6 dark:border-orange-800/30 dark:bg-orange-950/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {headline}
            </h2>
            {digestTier === 'narrow' && (
              <span className="inline-flex items-center rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200/50 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40">
                Preliminary
              </span>
            )}
            {digestTier === 'mastery' && (
              <span className="inline-flex items-center rounded-full bg-green-100/80 px-2.5 py-0.5 text-xs font-medium text-green-800 border border-green-200/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/40">
                Mastery
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generated {formattedDate}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="shrink-0 self-start rounded-xl border-orange-200/50 dark:border-orange-800/40"
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

function ErrorPatternSummary({ summary }: { summary: string }) {
  return (
    <section className="space-y-4">
      <h2 className="heading-sm text-foreground flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        Error Pattern Summary
      </h2>
      <div className="rounded-2xl border border-amber-200/40 bg-amber-50/30 p-5 dark:border-amber-800/30 dark:bg-amber-950/20">
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
  weakSpotCount,
  onViewDetails,
}: {
  subjectName: string;
  subjectColor: string | null;
  healthSummary: string;
  topicClusters?: TopicCluster[];
  weakSpotCount: number;
  onViewDetails: () => void;
}) {
  const clusterCount = topicClusters?.length ?? 0;
  const safeColor =
    subjectColor && subjectColor in SUBJECT_CONSTANTS.COLOR_GRADIENTS
      ? subjectColor
      : SUBJECT_CONSTANTS.DEFAULT_COLOR;
  const colorClasses =
    SUBJECT_CONSTANTS.COLOR_GRADIENTS[
      safeColor as keyof typeof SUBJECT_CONSTANTS.COLOR_GRADIENTS
    ];

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 ${colorClasses.border} ${colorClasses.light} ${colorClasses.dark}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {subjectName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {healthSummary}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {weakSpotCount > 0 && (
              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-3 w-3" />
                {weakSpotCount} weak spot{weakSpotCount !== 1 ? 's' : ''}
              </span>
            )}
            {clusterCount > 0 && (
              <span>
                {clusterCount} topic cluster{clusterCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onViewDetails}
          className={`shrink-0 self-start rounded-xl ${colorClasses.border} ${colorClasses.iconColor} ${colorClasses.buttonHover}`}
        >
          Details
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
