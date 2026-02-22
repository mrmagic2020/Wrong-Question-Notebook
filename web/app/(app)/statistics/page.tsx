import type { Metadata } from 'next';
import StatisticsPageClient from './statistics-page-client';
import { createClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';
import {
  CACHE_DURATIONS,
  CACHE_TAGS,
  createUserCacheTag,
} from '@/lib/cache-config';
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

export const metadata: Metadata = {
  title: 'Statistics – Wrong Question Notebook',
  description: 'Track your study progress, mastery, and streaks',
};

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
};

async function loadStatistics() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    return emptyData;
  }

  const cachedLoad = unstable_cache(
    async (uid: string, client: any): Promise<StatisticsData> => {
      const [
        overviewRes,
        streaksRes,
        sessionRes,
        subjectRes,
        weeklyRes,
        heatmapRes,
        recentRes,
      ] = await Promise.all([
        client.rpc('get_user_statistics', { p_user_id: uid }),
        client.rpc('get_study_streaks', { p_user_id: uid }),
        client.rpc('get_session_statistics', { p_user_id: uid }),
        client.rpc('get_subject_breakdown', { p_user_id: uid }),
        client.rpc('get_weekly_progress', { p_user_id: uid }),
        client.rpc('get_activity_heatmap', { p_user_id: uid }),
        client.rpc('get_recent_study_activity', { p_user_id: uid }),
      ]);

      return {
        overview:
          (overviewRes.data as StatisticsOverview) ?? emptyData.overview,
        streaks: (streaksRes.data as StudyStreaks) ?? emptyData.streaks,
        sessionStats:
          (sessionRes.data as SessionStatistics) ?? emptyData.sessionStats,
        subjectBreakdown: (subjectRes.data as SubjectBreakdownRow[]) ?? [],
        weeklyProgress: (weeklyRes.data as WeeklyProgressPoint[]) ?? [],
        activityHeatmap: (heatmapRes.data as ActivityDay[]) ?? [],
        recentActivity: (recentRes.data as RecentStudyActivity[]) ?? [],
      };
    },
    [`statistics-${userId}`],
    {
      tags: [
        CACHE_TAGS.USER_STATISTICS,
        createUserCacheTag(CACHE_TAGS.USER_STATISTICS, userId),
      ],
      revalidate: CACHE_DURATIONS.STATISTICS,
    }
  );

  return await cachedLoad(userId, supabase);
}

export default async function StatisticsPage() {
  const data = await loadStatistics();
  return (
    <div className="page-container">
      <StatisticsPageClient data={data} />
    </div>
  );
}
