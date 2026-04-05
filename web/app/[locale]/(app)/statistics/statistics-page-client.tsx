'use client';

import { FileQuestion, Trophy, Flame, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatisticsData } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { HeroStatCard } from '@/components/statistics/hero-stat-card';
import { StatusDoughnutChart } from '@/components/statistics/status-doughnut-chart';
import { SubjectBarChart } from '@/components/statistics/subject-bar-chart';
import { SubjectRadarChart } from '@/components/statistics/subject-radar-chart';
import { ProgressLineChart } from '@/components/statistics/progress-line-chart';
import { ActivityHeatmap } from '@/components/statistics/activity-heatmap';
import { RecentActivityFeedUser } from '@/components/statistics/recent-activity-feed-user';
import { formatDuration } from '@/lib/common-utils';

interface StatisticsPageClientProps {
  data: StatisticsData;
}

export default function StatisticsPageClient({
  data,
}: StatisticsPageClientProps) {
  const t = useTranslations('Statistics');
  const tCommon = useTranslations('Common');
  const { overview, streaks, sessionStats, subjectBreakdown } = data;

  return (
    <div className="section-container">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {/* Row 1: Hero stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <HeroStatCard
          icon={FileQuestion}
          value={overview.total_problems}
          label={t('totalProblems')}
          color="amber"
        />
        <HeroStatCard
          icon={Trophy}
          value={`${overview.mastery_rate}%`}
          label={t('masteryRate')}
          sublabel={t('masteredProblems', { count: overview.mastered_count })}
          color="emerald"
        />
        <HeroStatCard
          icon={Flame}
          value={streaks.current_streak}
          label={t('dayStreak')}
          sublabel={`${tCommon('of')} ${streaks.longest_streak} ${t('longestStreak')}`}
          color="orange"
        />
        <HeroStatCard
          icon={Clock}
          value={
            sessionStats.total_review_time_ms > 0
              ? formatDuration(sessionStats.total_review_time_ms)
              : '0:00'
          }
          label={t('totalReviewTime')}
          sublabel={`${sessionStats.total_sessions} ${t('totalSessions')}`}
          color="rose"
        />
      </div>

      {/* Row 2: Status doughnut + Subject bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 stats-bento-card min-h-[300px]">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            {t('statusDistribution')}
          </h3>
          <StatusDoughnutChart overview={overview} />
        </div>
        <div className="lg:col-span-7 stats-bento-card min-h-[300px]">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            {t('notebookBreakdown')}
          </h3>
          <div className="h-[250px]">
            <SubjectBarChart data={subjectBreakdown} />
          </div>
        </div>
      </div>

      {/* Row 3: Progress line + Subject radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 stats-bento-card min-h-[300px]">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            {t('masteryProgress')}
          </h3>
          <div className="h-[250px]">
            <ProgressLineChart data={data.weeklyProgress} />
          </div>
        </div>
        <div className="lg:col-span-5 stats-bento-card min-h-[300px]">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            {t('masteryRadar')}
          </h3>
          <div className="h-[250px]">
            <SubjectRadarChart data={subjectBreakdown} />
          </div>
        </div>
      </div>

      {/* Row 4: Activity heatmap + Recent Activity (height-matched) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Heatmap defines the row height */}
        <div className="lg:col-span-7">
          <ActivityHeatmap
            data={data.activityHeatmap}
            timezone={data.timezone}
          />
        </div>
        {/* Activity feed is positioned absolutely so it doesn't stretch the row */}
        <div className="lg:col-span-5 relative">
          <div className="lg:absolute lg:inset-0">
            <RecentActivityFeedUser activities={data.recentActivity} />
          </div>
        </div>
      </div>
    </div>
  );
}
