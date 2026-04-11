import { useTranslations } from 'next-intl';
import {
  Users,
  Activity,
  TrendingUp,
  Shield,
  FileQuestion,
  BookOpen,
  FolderOpen,
  Target,
  HardDrive,
} from 'lucide-react';
import { StatCard } from './stat-card';
import { RecentActivityFeed } from './recent-activity-feed';
import { QuickActions } from './quick-actions';
import { UserStatisticsType } from '@/lib/schemas';

import { formatBytes } from '@/lib/format-utils';

interface DashboardClientProps {
  userStats: UserStatisticsType;
  contentStats: {
    total_problems: number;
    total_subjects: number;
    total_problem_sets: number;
    total_attempts: number;
  };
  storageStats: {
    totalBytes: number;
    fileCount: number;
  };
  recentActivity: React.ComponentProps<typeof RecentActivityFeed>['activities'];
}

export function DashboardClient({
  userStats,
  contentStats,
  storageStats,
  recentActivity,
}: DashboardClientProps) {
  const t = useTranslations('Admin');
  const tCommon = useTranslations('Common');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('platformOverview')}
        </p>
      </div>

      {/* User Stat Cards */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          {t('users')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            value={userStats.total_users}
            label={t('totalUsers')}
            sublabel={t('newToday', { count: userStats.new_users_today })}
            color="amber"
          />
          <StatCard
            icon={Activity}
            value={userStats.active_users}
            label={t('activeUsers')}
            sublabel={t('currentlyActive')}
            color="emerald"
          />
          <StatCard
            icon={TrendingUp}
            value={userStats.new_users_this_week}
            label={t('newThisWeek')}
            sublabel={t('last7Days')}
            color="blue"
          />
          <StatCard
            icon={Shield}
            value={userStats.admin_users}
            label={t('adminUsers')}
            sublabel={t('withAdminPrivileges')}
            color="purple"
          />
        </div>
      </div>

      {/* Content Stat Cards */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          {t('content')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={FileQuestion}
            value={contentStats.total_problems}
            label={t('problems')}
            color="orange"
          />
          <StatCard
            icon={BookOpen}
            value={contentStats.total_subjects}
            label={t('subjects')}
            color="rose"
          />
          <StatCard
            icon={FolderOpen}
            value={contentStats.total_problem_sets}
            label={t('sets')}
            color="blue"
          />
          <StatCard
            icon={Target}
            value={contentStats.total_attempts}
            label={t('attempts')}
            color="emerald"
          />
          <StatCard
            icon={HardDrive}
            value={formatBytes(storageStats.totalBytes)}
            label={tCommon('storage')}
            sublabel={t('files', { count: storageStats.fileCount })}
            color="purple"
          />
        </div>
      </div>

      {/* Bottom row: Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="admin-section-card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('recentActivityTitle')}
          </h2>
          <RecentActivityFeed activities={recentActivity} />
        </div>

        {/* Quick Actions */}
        <div className="admin-section-card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('quickActions')}
          </h2>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
