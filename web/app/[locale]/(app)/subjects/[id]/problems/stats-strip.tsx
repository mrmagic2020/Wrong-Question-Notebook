'use client';

import { useTranslations } from 'next-intl';
import { Problem } from '@/lib/types';

export default function StatsStrip({ problems }: { problems: Problem[] }) {
  const t = useTranslations('Statistics');

  if (problems.length === 0) return null;

  const totalCount = problems.length;
  const wrongCount = problems.filter(p => p.status === 'wrong').length;
  const needsReviewCount = problems.filter(
    p => p.status === 'needs_review'
  ).length;
  const masteredCount = problems.filter(p => p.status === 'mastered').length;
  const masteryPercentage = Math.round((masteredCount / totalCount) * 100);

  const wrongPct = (wrongCount / totalCount) * 100;
  const reviewPct = (needsReviewCount / totalCount) * 100;
  const masteredPct = (masteredCount / totalCount) * 100;

  return (
    <div className="bg-amber-50/30 dark:bg-gray-800/20 rounded-xl p-4 border border-amber-200/20 dark:border-gray-700/30">
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        {/* Total */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-foreground">
            {totalCount}
          </span>
          <span className="text-sm text-muted-foreground">
            {t('problem', { count: totalCount })}
          </span>
        </div>

        {/* Status bar */}
        <div className="flex-1 min-w-[120px]">
          <div className="flex h-2.5 rounded-full overflow-hidden bg-muted/50">
            {wrongPct > 0 && (
              <div
                className="bg-red-400 dark:bg-red-500 transition-all duration-300"
                style={{ width: `${wrongPct}%` }}
              />
            )}
            {reviewPct > 0 && (
              <div
                className="bg-amber-400 dark:bg-amber-500 transition-all duration-300"
                style={{ width: `${reviewPct}%` }}
              />
            )}
            {masteredPct > 0 && (
              <div
                className="bg-green-400 dark:bg-green-500 transition-all duration-300"
                style={{ width: `${masteredPct}%` }}
              />
            )}
          </div>
        </div>

        {/* Mastery percentage */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            {masteryPercentage}%
          </span>
          <span className="text-sm text-muted-foreground">
            {t('masteredLabel')}
          </span>
        </div>
      </div>
    </div>
  );
}
