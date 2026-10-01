import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import StatisticsPageClient from './statistics-page-client';
import { createClient } from '@/lib/supabase/server';
import { CACHE_DURATIONS } from '@/lib/cache-config';
import { cacheUserData } from '@/lib/user-data-cache';
import { getUserTimezone } from '@/lib/timezone-utils';
import type {
  StatisticsData,
  StatisticsOverview,
  StudyStreaks,
  SessionStatistics,
  SubjectBreakdownRow,
  WeeklyProgressPoint,
  ActivityDay,
  RecentStudyActivity,
} from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return {
    title: t('statisticsMetaTitle'),
    description: t('statisticsMetaDescription'),
  };
}

const emptyData: StatisticsData = {
  overview: {
    total_problems: 0,
    mastered_count: 0,
    needs_review_count: 0,
    wrong_count: 0,
    mastery_rate: 0,
  },
  streaks: { current_streak: 0, longest_streak: 0 },
  sessionStats: {
    total_sessions: 0,
    avg_duration_ms: 0,
    avg_problems_per_session: 0,
    total_review_time_ms: 0,
  },
  subjectBreakdown: [],
  weeklyProgress: [],
  activityHeatmap: [],
  recentActivity: [],
  timezone: 'UTC',
};

async function loadStatistics() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    return emptyData;
  }

  const userTz = await getUserTimezone(userId);

  // Typed loosely, as before this loader was cached: the generated row types
  // don't line up with the app's hand-written Problem/Subject/stat types.
  const db: any = supabase;

  return await cacheUserData(
    async (): Promise<StatisticsData> => {
      const [
        overviewRes,
        streaksRes,
        sessionRes,
        subjectRes,
        weeklyRes,
        heatmapRes,
        recentRes,
      ] = await Promise.all([
        db.rpc('get_user_statistics', { p_user_id: userId }),
        db.rpc('get_study_streaks', {
          p_user_id: userId,
          p_user_tz: userTz,
        }),
        db.rpc('get_session_statistics', { p_user_id: userId }),
        db.rpc('get_subject_breakdown', { p_user_id: userId }),
        db.rpc('get_weekly_progress', {
          p_user_id: userId,
          p_user_tz: userTz,
        }),
        db.rpc('get_activity_heatmap', {
          p_user_id: userId,
          p_user_tz: userTz,
        }),
        db.rpc('get_recent_study_activity', { p_user_id: userId }),
      ]);

      // Log individual RPC errors but fall back gracefully
      const rpcResults = [
        { name: 'get_user_statistics', res: overviewRes },
        { name: 'get_study_streaks', res: streaksRes },
        { name: 'get_session_statistics', res: sessionRes },
        { name: 'get_subject_breakdown', res: subjectRes },
        { name: 'get_weekly_progress', res: weeklyRes },
        { name: 'get_activity_heatmap', res: heatmapRes },
        { name: 'get_recent_study_activity', res: recentRes },
      ];
      for (const { name, res } of rpcResults) {
        if (res.error) {
          console.error(`Statistics RPC ${name} failed:`, res.error.message);
        }
      }

      return {
        overview: overviewRes.error
          ? emptyData.overview
          : ((overviewRes.data as StatisticsOverview) ?? emptyData.overview),
        streaks: streaksRes.error
          ? emptyData.streaks
          : ((streaksRes.data as StudyStreaks) ?? emptyData.streaks),
        sessionStats: sessionRes.error
          ? emptyData.sessionStats
          : ((sessionRes.data as SessionStatistics) ?? emptyData.sessionStats),
        subjectBreakdown: subjectRes.error
          ? []
          : ((subjectRes.data as SubjectBreakdownRow[]) ?? []),
        weeklyProgress: weeklyRes.error
          ? []
          : ((weeklyRes.data as WeeklyProgressPoint[]) ?? []),
        activityHeatmap: heatmapRes.error
          ? []
          : ((heatmapRes.data as ActivityDay[]) ?? []),
        recentActivity: recentRes.error
          ? []
          : ((recentRes.data as RecentStudyActivity[]) ?? []),
        timezone: userTz,
      };
    },
    {
      userId,
      key: ['statistics', userTz],
      revalidate: CACHE_DURATIONS.STATISTICS,
    }
  );
}

export default async function StatisticsPage() {
  const data = await loadStatistics();
  return <StatisticsPageClient data={data} />;
}
