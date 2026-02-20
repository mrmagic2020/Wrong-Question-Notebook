import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/common-utils';
import { UserActivityLogType } from '@/lib/schemas';

type ActivityWithProfile = UserActivityLogType & {
  user_profiles?: {
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  };
};

interface RecentActivityFeedProps {
  activities: ActivityWithProfile[];
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        No recent activity
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map(activity => {
        const profile = activity.user_profiles;
        const displayName =
          profile?.username ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
          'Unknown User';

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 py-2 border-b border-amber-100/50 dark:border-stone-800/50 last:border-0"
          >
            <div className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 mt-2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                <span className="font-medium">{displayName}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {' '}
                  {activity.action}
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {formatRelativeTime(activity.created_at)}
              </p>
            </div>
            {activity.resource_type && (
              <Badge
                variant="outline"
                className="text-xs flex-shrink-0 border-amber-200/50 dark:border-amber-800/40 text-amber-700 dark:text-amber-300"
              >
                {activity.resource_type}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
