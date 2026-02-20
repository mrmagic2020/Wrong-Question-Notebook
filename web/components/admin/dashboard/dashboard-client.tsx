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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

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
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Platform overview and quick actions
        </p>
      </div>

      {/* User Stat Cards */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Users
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            value={userStats.total_users}
            label="Total Users"
            sublabel={`${userStats.new_users_today} new today`}
            color="amber"
          />
          <StatCard
            icon={Activity}
            value={userStats.active_users}
            label="Active Users"
            sublabel="Currently active"
            color="emerald"
          />
          <StatCard
            icon={TrendingUp}
            value={userStats.new_users_this_week}
            label="New This Week"
            sublabel="Last 7 days"
            color="blue"
          />
          <StatCard
            icon={Shield}
            value={userStats.admin_users}
            label="Admin Users"
            sublabel="With admin privileges"
            color="purple"
          />
        </div>
      </div>

      {/* Content Stat Cards */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Content
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={FileQuestion}
            value={contentStats.total_problems}
            label="Problems"
            color="orange"
          />
          <StatCard
            icon={BookOpen}
            value={contentStats.total_subjects}
            label="Subjects"
            color="rose"
          />
          <StatCard
            icon={FolderOpen}
            value={contentStats.total_problem_sets}
            label="Problem Sets"
            color="blue"
          />
          <StatCard
            icon={Target}
            value={contentStats.total_attempts}
            label="Attempts"
            color="emerald"
          />
          <StatCard
            icon={HardDrive}
            value={formatBytes(storageStats.totalBytes)}
            label="Storage"
            sublabel={`${storageStats.fileCount} files`}
            color="purple"
          />
        </div>
      </div>

      {/* Bottom row: Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="admin-section-card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <RecentActivityFeed activities={recentActivity} />
        </div>

        {/* Quick Actions */}
        <div className="admin-section-card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
