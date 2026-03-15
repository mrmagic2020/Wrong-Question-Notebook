'use client';

import { cn } from '@/lib/utils';
import { ERROR_CATEGORY_LABELS, ERROR_CATEGORY_COLORS } from '@/lib/constants';
import type { ErrorCategorisation } from '@/lib/types';
import { Tooltip } from '@/components/ui/tooltip';

interface ErrorCategoryBadgeProps {
  categorisation: ErrorCategorisation;
  onClick?: () => void;
}

export function ErrorCategoryBadge({
  categorisation,
  onClick,
}: ErrorCategoryBadgeProps) {
  const colors = ERROR_CATEGORY_COLORS[categorisation.broad_category];
  const label = ERROR_CATEGORY_LABELS[categorisation.broad_category];

  const badgeContent = (
    <>
      <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
      {label}
    </>
  );

  const badge = onClick ? (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        colors.bg,
        colors.text,
        'cursor-pointer hover:opacity-80 transition-opacity'
      )}
      onClick={onClick}
    >
      {badgeContent}
    </button>
  ) : (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        colors.bg,
        colors.text
      )}
    >
      {badgeContent}
    </span>
  );

  if (categorisation.granular_tag) {
    return (
      <Tooltip content={categorisation.granular_tag} side="top">
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
