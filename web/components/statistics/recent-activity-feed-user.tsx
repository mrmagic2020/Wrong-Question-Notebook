'use client';

import { ArrowRight } from 'lucide-react';
import { RecentStudyActivity } from '@/lib/types';
import { formatRelativeTime } from '@/lib/common-utils';

interface RecentActivityFeedUserProps {
  activities: RecentStudyActivity[];
}

const statusBadgeClass: Record<string, string> = {
  mastered: 'status-mastered',
  needs_review: 'status-needs-review',
  wrong: 'status-wrong',
};

const statusLabel: Record<string, string> = {
  mastered: 'Mastered',
  needs_review: 'Needs Review',
  wrong: 'Wrong',
};

export function RecentActivityFeedUser({
  activities,
}: RecentActivityFeedUserProps) {
  if (activities.length === 0) {
    return (
      <div className="stats-bento-card flex flex-col h-full">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
          Recent Activity
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No recent activity yet. Start reviewing problems!
        </p>
      </div>
    );
  }

  return (
    <div className="stats-bento-card flex flex-col h-full overflow-hidden">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 shrink-0">
        Recent Activity
      </h3>
      <div className="overflow-y-auto min-h-0 flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-3">
          {activities.map((activity, i) => (
            <div
              key={`${activity.problem_id}-${i}`}
              className="flex items-center gap-2 text-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {activity.problem_title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.subject_name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {activity.old_status && (
                  <>
                    <span
                      className={
                        statusBadgeClass[activity.old_status] || 'status-wrong'
                      }
                    >
                      {statusLabel[activity.old_status] || activity.old_status}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  </>
                )}
                <span
                  className={
                    statusBadgeClass[activity.new_status] || 'status-wrong'
                  }
                >
                  {statusLabel[activity.new_status] || activity.new_status}
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 w-16 text-right">
                {formatRelativeTime(activity.changed_at)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
