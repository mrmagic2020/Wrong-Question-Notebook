import {
  getUserStatistics,
  getRecentActivity,
  getContentStatistics,
  getTotalStorageUsage,
} from '@/lib/user-management';
import { DashboardClient } from '@/components/admin/dashboard/dashboard-client';
import { unstable_cache } from 'next/cache';
import { CACHE_DURATIONS, CACHE_TAGS } from '@/lib/cache-config';

export default async function AdminDashboardPage() {
  const cachedLoadDashboardData = unstable_cache(
    async () => {
      const [userStats, contentStats, storageStats, recentActivity] =
        await Promise.all([
          getUserStatistics(),
          getContentStatistics(),
          getTotalStorageUsage(),
          getRecentActivity(5),
        ]);

      return {
        userStats: userStats || {
          total_users: 0,
          active_users: 0,
          admin_users: 0,
          new_users_today: 0,
          new_users_this_week: 0,
        },
        contentStats,
        storageStats,
        recentActivity,
      };
    },
    ['admin-dashboard'],
    {
      tags: [CACHE_TAGS.ADMIN_STATS, CACHE_TAGS.ADMIN_USERS],
      revalidate: CACHE_DURATIONS.ADMIN_STATS,
    }
  );

  const { userStats, contentStats, storageStats, recentActivity } =
    await cachedLoadDashboardData();

  return (
    <DashboardClient
      userStats={userStats}
      contentStats={contentStats}
      storageStats={storageStats}
      recentActivity={recentActivity}
    />
  );
}
