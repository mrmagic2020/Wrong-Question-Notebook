'use client';

import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { RecentStudyActivity } from '@/lib/types';
import { formatRelativeTime } from '@/lib/common-utils';

type StatusKey = 'status.wrong' | 'status.needs_review' | 'status.mastered';

interface RecentActivityFeedUserProps {
  activities: RecentStudyActivity[];
}

const statusBadgeClass: Record<string, string> = {
  mastered: 'status-mastered',
  needs_review: 'status-needs-review',
  wrong: 'status-wrong',
};

export function RecentActivityFeedUser({
  activities,
}: RecentActivityFeedUserProps) {
  const t = useTranslations('Statistics');
  const locale = useLocale();

  if (activities.length === 0) {
    return (
      <div className="stats-bento-card flex flex-col h-full">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
          {t('recentActivityTitle')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          {t('noRecentActivity')}
        </p>
      </div>
    );
  }

  return (
    <div className="stats-bento-card flex flex-col h-full overflow-hidden">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 shrink-0">
        {t('recentActivityTitle')}
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
                      {t(`status.${activity.old_status}` as StatusKey)}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  </>
                )}
                <span
                  className={
                    statusBadgeClass[activity.new_status] || 'status-wrong'
                  }
                >
                  {t(`status.${activity.new_status}` as StatusKey)}
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 w-16 text-right">
                {formatRelativeTime(activity.changed_at, locale)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
