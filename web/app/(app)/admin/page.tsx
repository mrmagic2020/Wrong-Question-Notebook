import { createClient } from '@/lib/supabase/server';
import {
  getUserStatistics,
  getRecentActivity,
  getAdminSettings,
} from '@/lib/user-management';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, Settings, Shield } from 'lucide-react';
import { formatDisplayDateTime } from '@/lib/common-utils';
import { unstable_cache } from 'next/cache';
import { CACHE_DURATIONS, CACHE_TAGS } from '@/lib/cache-config';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Get current user
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return null;
  }

  const cachedLoadDashboardData = unstable_cache(
    async () => {
      // Fetch dashboard data
      const [statistics, recentActivity, settings] = await Promise.all([
        getUserStatistics(),
        getRecentActivity(),
        getAdminSettings(),
      ]);

      return { statistics, recentActivity, settings };
    },
    [`admin-dashboard-${authData.user.id}`],
    {
      tags: [CACHE_TAGS.ADMIN_STATS, CACHE_TAGS.ADMIN_USERS],
      revalidate: CACHE_DURATIONS.ADMIN_STATS,
    }
  );

  const { statistics, recentActivity, settings } =
    await cachedLoadDashboardData();

  return (
    <div className="section-container">
      <div className="flex items-center justify-between">
        <div className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-description">
            Welcome back, {authData.user.email}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Administrator
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.total_users || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.new_users_today || 0} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.active_users || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.admin_users || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              With admin privileges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.new_users_this_week || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest user actions across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDisplayDateTime(activity.created_at)}
                    </p>
                  </div>
                  {activity.resource_type && (
                    <Badge variant="outline" className="text-xs">
                      {activity.resource_type}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body-sm text-muted-foreground">
              No recent activity
            </p>
          )}
        </CardContent>
      </Card>

      {/* System Settings Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Current application configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {settings.map(setting => (
              <div
                key={setting.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{setting.key.replace('_', ' ')}</p>
                  {setting.description && (
                    <p className="text-sm text-muted-foreground">
                      {setting.description}
                    </p>
                  )}
                </div>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
