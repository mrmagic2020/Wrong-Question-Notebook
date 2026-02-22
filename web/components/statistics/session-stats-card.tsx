'use client';

import { Clock, BookOpen, Timer, CalendarCheck } from 'lucide-react';
import { SessionStatistics } from '@/lib/types';
import { formatDuration } from '@/lib/common-utils';

interface SessionStatsCardProps {
  stats: SessionStatistics;
}

export function SessionStatsCard({ stats }: SessionStatsCardProps) {
  const items = [
    {
      icon: CalendarCheck,
      value: stats.total_sessions.toLocaleString(),
      label: 'Sessions',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    },
    {
      icon: Clock,
      value:
        stats.avg_duration_ms > 0
          ? formatDuration(stats.avg_duration_ms)
          : '0:00',
      label: 'Avg Duration',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    },
    {
      icon: BookOpen,
      value: stats.avg_problems_per_session.toFixed(1),
      label: 'Avg Problems',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    },
    {
      icon: Timer,
      value:
        stats.total_review_time_ms > 0
          ? formatDuration(stats.total_review_time_ms)
          : '0:00',
      label: 'Total Time',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    },
  ];

  return (
    <div className="stats-bento-card">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
        Review Sessions
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.label} className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}
            >
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {item.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
