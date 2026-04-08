'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import {
  Sparkles,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Loader2,
  TrendingUp,
  FileQuestion,
  Layers,
  NotebookPen,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { HeroStatCard } from '@/components/statistics/hero-stat-card';
import type { ActivitySummary, InsightDigest, TopicCluster } from '@/lib/types';
import { SUBJECT_CONSTANTS, INSIGHT_CONSTANTS } from '@/lib/constants';
import { apiUrl } from '@/lib/api-utils';

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
  const t = useTranslations('Statistics');
  const tCommon = useTranslations('Common');
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
        toast.error(t('insightsGenerationTimeout'));
        return;
      }

      try {
        const res = await fetch(apiUrl('/api/insights/status'));
        const json = await res.json();
        const data = json.data ?? json;

        if (data.status === 'completed' && data.digest) {
          setDigest(data.digest);
          setIsGenerating(false);
          stopPolling();
          toast.success(tCommon('success'));
        } else if (data.status === 'failed' || data.status === 'none') {
          setIsGenerating(false);
          stopPolling();
          toast.error(tCommon('error'));
        }
        // 'generating' → keep polling
      } catch {
        // Network error — keep polling
      }
    }, INSIGHT_CONSTANTS.GENERATION_POLL_INTERVAL_MS);
  }, [stopPolling, t, tCommon]);

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
      const res = await fetch(apiUrl('/api/insights/generate'), {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok && res.status !== 202) {
        if (res.status === 409) {
          // Already generating — start polling
          startPolling();
          return;
        }
        throw new Error(json?.error || 'Failed to generate insights');
      }

      const data = json.data ?? json;

      // 202 = generation started in background — poll for completion
      if (res.status === 202) {
        startPolling();
        return;
      }

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
        toast.info(t('insightsRecentlyGenerated'));
        return;
      }

      setDigest(data);
      setIsGenerating(false);
      toast.success(tCommon('success'));
      router.refresh();
    } catch (err) {
      setIsGenerating(false);
      toast.error(
        err instanceof Error ? err.message : tCommon('error')
      );
    }
  }

  // We have a digest (or showing empty/generating/insufficient state)
  const subjectHealth = digest?.subject_health || {};

  return (
    <div className="section-container">
      <PageHeader title={t('insights')} description={t('insightsSubtitle')} />

      {/* Empty / Generating / Insufficient data states */}
      {(!digest || isGenerating || hasInsufficientData) && (
        <EmptyInsightsState
          isGenerating={isGenerating}
          hasInsufficientData={hasInsufficientData}
          onGenerate={handleGenerate}
          activityProgress={activityProgress}
          t={t}
          tCommon={tCommon}
        />
      )}

      {/* Digest content */}
      {digest && !isGenerating && !hasInsufficientData && (
        <>
          {/* Digest Header */}
          <DigestHeader
            headline={digest.headline}
            generatedAt={digest.generated_at}
            onRegenerate={handleGenerate}
            isGenerating={isGenerating}
            digestTier={digest.digest_tier}
            t={t}
            tCommon={tCommon}
          />

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeroStatCard
              icon={BookOpen}
              value={Object.keys(subjectHealth).length}
              label={t('subjects')}
              color="blue"
            />
            <HeroStatCard
              icon={AlertTriangle}
              value={digest.weak_spots?.length ?? 0}
              label={t('weakSpots')}
              color="rose"
            />
            <HeroStatCard
              icon={Layers}
              value={Object.values(digest.topic_clusters ?? {}).reduce(
                (sum, arr) => sum + arr.length,
                0
              )}
              label={t('topicClusters')}
              color="amber"
            />
            <HeroStatCard
              icon={Sparkles}
              value={
                digest.digest_tier === 'mastery'
                  ? t('mastery')
                  : digest.digest_tier === 'narrow'
                    ? t('preliminary')
                    : t('full')
              }
              label={t('analysisDepth')}
              color={
                digest.digest_tier === 'mastery'
                  ? 'emerald'
                  : digest.digest_tier === 'narrow'
                    ? 'amber'
                    : 'orange'
              }
            />
          </div>

          {/* Bento grid: Error patterns + Subject cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Error Pattern Summary */}
            {digest.error_pattern_summary && (
              <div className="lg:col-span-5 lg:flex lg:flex-col">
                <div className="lg:sticky lg:top-20 shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/20">
                      <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('errorPatterns')}
                    </h3>
                  </div>
                  <div className="rounded-2xl border border-amber-200/40 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-5 dark:border-amber-800/30 dark:from-amber-950/20 dark:to-orange-950/10">
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {digest.error_pattern_summary}
                    </p>
                  </div>
                </div>
                {/* Decorative notebook filler — stretches to match subject column */}
                <div className="mt-4 hidden lg:block flex-1 rounded-2xl border border-amber-200/20 dark:border-amber-900/20 overflow-hidden min-h-[3rem]">
                  <div className="ruled-lines h-full relative opacity-60">
                    <NotebookPen className="absolute bottom-4 right-4 h-10 w-10 text-amber-300/40 dark:text-amber-700/30 -rotate-12" />
                  </div>
                </div>
              </div>
            )}

            {/* Subject Overview */}
            {Object.keys(subjectHealth).length > 0 && (
              <div
                className={
                  digest.error_pattern_summary
                    ? 'lg:col-span-7'
                    : 'lg:col-span-12'
                }
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t('subjectOverview')}
                  </h3>
                </div>
                <div
                  className={`grid grid-cols-1 gap-3 ${
                    digest.error_pattern_summary
                      ? 'sm:grid-cols-2'
                      : 'sm:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  {Object.entries(subjectHealth).map(
                    ([subjectId, healthSummary]) => (
                      <SubjectHealthCard
                        key={subjectId}
                        subjectName={
                          subjectMap[subjectId]?.name || tCommon('noData')
                        }
                        subjectColor={subjectMap[subjectId]?.color ?? null}
                        healthSummary={healthSummary}
                        topicClusters={digest.topic_clusters?.[subjectId]}
                        weakSpotCount={weakSpotCountBySubject[subjectId] ?? 0}
                        onViewDetails={() =>
                          router.push(`/insights/${subjectId}`)
                        }
                        t={t}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ===== Sub-components ===== */

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
  t,
  tCommon,
}: {
  isGenerating: boolean;
  hasInsufficientData: boolean;
  onGenerate: () => void;
  activityProgress?: {
    activity: ActivitySummary;
    activity_needed: number;
    errors_needed: number;
  } | null;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-orange-200/40 bg-orange-50/50 p-12 text-center dark:border-orange-800/30 dark:bg-orange-950/30">
      {isGenerating ? (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 dark:bg-orange-500/20">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {t('generatingInsights')}
          </h3>
          <p className="max-w-sm text-sm text-gray-600 dark:text-gray-400">
            {t('generatingInsightsDesc')}
          </p>
        </>
      ) : hasInsufficientData ? (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/20">
            <FileQuestion className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {activityProgress
              ? t('almostThere')
              : t('notEnoughData')}
          </h3>
          {activityProgress ? (
            <div className="mb-6 flex flex-col items-center gap-3 pt-2">
              <ProgressBar
                label={t('problemsAttempted')}
                current={activityProgress.activity.total_problems}
                target={INSIGHT_CONSTANTS.MIN_ACTIVITY_FOR_INSIGHTS}
                met={activityProgress.activity_needed === 0}
              />
              <ProgressBar
                label={t('errorsToAnalyse')}
                current={activityProgress.activity.problems_with_errors}
                target={INSIGHT_CONSTANTS.MIN_ERRORS_FOR_FULL_DIGEST}
                met={activityProgress.errors_needed === 0}
              />
              <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                {activityProgress.activity_needed > 0 &&
                activityProgress.errors_needed > 0
                  ? t('attemptMoreProblems', {
                      count: activityProgress.activity_needed,
                    })
                  : activityProgress.activity_needed > 0
                    ? t('attemptMoreProblems', {
                        count: activityProgress.activity_needed,
                      })
                    : t('logMoreWrongAnswers', {
                        count: activityProgress.errors_needed,
                      })}
              </p>
            </div>
          ) : (
            <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
              {t('notEnoughDataDesc')}
            </p>
          )}
          <Button
            variant="outline"
            onClick={onGenerate}
            className="rounded-xl border-amber-200/50 dark:border-amber-800/40"
          >
            {tCommon('tryAgain')}
          </Button>
        </>
      ) : (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 dark:bg-orange-500/20">
            <Sparkles className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {t('noInsightsYet')}
          </h3>
          <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
            {t('generateFirstInsightsDesc')}
          </p>
          <Button onClick={onGenerate} className="btn-cta-primary">
            <Sparkles className="mr-2 h-4 w-4" />
            {t('generateInsights')}
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
  t,
  tCommon,
}: {
  headline: string;
  generatedAt: string;
  onRegenerate: () => void;
  isGenerating: boolean;
  digestTier?: string;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const locale = useLocale();
  const formattedDate = new Date(generatedAt).toLocaleString(
    locale === 'zh-CN' ? 'zh-CN' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  );

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
                {t('preliminary')}
              </span>
            )}
            {digestTier === 'mastery' && (
              <span className="inline-flex items-center rounded-full bg-green-100/80 px-2.5 py-0.5 text-xs font-medium text-green-800 border border-green-200/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/40">
                {t('mastery')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('generated')} {formattedDate}
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
          {tCommon('refresh')}
        </Button>
      </div>
    </div>
  );
}

function SubjectHealthCard({
  subjectName,
  subjectColor,
  healthSummary,
  topicClusters,
  weakSpotCount,
  onViewDetails,
  t,
}: {
  subjectName: string;
  subjectColor: string | null;
  healthSummary: string;
  topicClusters?: TopicCluster[];
  weakSpotCount: number;
  onViewDetails: () => void;
  t: ReturnType<typeof useTranslations>;
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
    <button
      onClick={onViewDetails}
      className={`rounded-2xl border bg-gradient-to-br p-4 text-left transition-all hover:shadow-md group ${colorClasses.border} ${colorClasses.light} ${colorClasses.dark}`}
    >
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5">
        {subjectName}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
        {healthSummary}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-xs">
          {weakSpotCount > 0 && (
            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3 w-3" />
              {t('weakSpotCount', { count: weakSpotCount })}
            </span>
          )}
          {clusterCount > 0 && (
            <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Layers className="h-3 w-3" />
              {t('clusterCount', { count: clusterCount })}
            </span>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform dark:text-gray-500" />
      </div>
    </button>
  );
}
