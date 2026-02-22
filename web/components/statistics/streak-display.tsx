'use client';

import { Flame } from 'lucide-react';
import { StudyStreaks } from '@/lib/types';

interface StreakDisplayProps {
  streaks: StudyStreaks;
}

export function StreakDisplay({ streaks }: StreakDisplayProps) {
  const hasStreak = streaks.current_streak > 0;

  return (
    <div className="stats-bento-card flex flex-col items-center justify-center gap-3 text-center">
      <div className={hasStreak ? 'stats-streak-flame' : ''}>
        <Flame
          className={`w-10 h-10 ${
            hasStreak
              ? 'text-orange-500 dark:text-orange-400'
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      </div>
      <div>
        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
          {streaks.current_streak}
        </p>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Day Streak
        </p>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Longest: {streaks.longest_streak} day
        {streaks.longest_streak !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
