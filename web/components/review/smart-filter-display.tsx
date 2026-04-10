'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sparkles,
  XCircle,
  Clock,
  CheckCircle,
  Calendar,
  Tag,
  FileText,
  ChevronDown,
  CircleDot,
} from 'lucide-react';
import { FilterConfig } from '@/lib/types';
import {
  getProblemTypeDisplayName,
  getProblemStatusDisplayName,
} from '@/lib/common-utils';
import {
  ProblemStatus,
  PROBLEM_STATUS_VALUES,
  PROBLEM_TYPE_VALUES,
} from '@/lib/schemas';

interface SmartFilterCriteriaDisplayProps {
  filterConfig: FilterConfig;
  hideStatus?: boolean;
  /** Map of tag_id → tag_name for resolving filter tag IDs */
  tagNames?: Record<string, string>;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'wrong':
      return <XCircle className="h-3 w-3" />;
    case 'needs_review':
      return <Clock className="h-3 w-3" />;
    case 'mastered':
      return <CheckCircle className="h-3 w-3" />;
    default:
      return null;
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'wrong':
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/30';
    case 'needs_review':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800/30';
    case 'mastered':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/30';
    default:
      return '';
  }
}

/** Inline label used at the start of each filter row */
function FilterLabel({
  icon: Icon,
  label,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide w-[4.5rem] shrink-0">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

export default function SmartFilterCriteriaDisplay({
  filterConfig,
  hideStatus = false,
  tagNames = {},
}: SmartFilterCriteriaDisplayProps) {
  const t = useTranslations('Review');
  const tCommon = useTranslations('CommonUtils');
  const [open, setOpen] = useState(true);

  const statuses =
    filterConfig.statuses?.length > 0
      ? filterConfig.statuses
      : [...PROBLEM_STATUS_VALUES];
  const problemTypes =
    filterConfig.problem_types?.length > 0
      ? filterConfig.problem_types
      : [...PROBLEM_TYPE_VALUES];
  const hasTags = filterConfig.tag_ids?.length > 0;
  const resolvedTags = hasTags
    ? filterConfig.tag_ids
        .map(id => tagNames[id] || id)
        .sort((a, b) => a.localeCompare(b))
    : [];
  const hasDaysSinceReview = filterConfig.days_since_review != null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-amber-200/40 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/20 mb-6">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 cursor-pointer">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {t('smartFilterCriteria')}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-amber-600 dark:text-amber-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <div className="space-y-2.5 px-4 pb-4">
            {/* Status section */}
            {!hideStatus && (
              <div className="flex items-baseline gap-2">
                <FilterLabel icon={CircleDot} label={t('status')} />
                <div className="flex flex-wrap gap-1.5 min-w-0 flex-1">
                  {statuses.map(status => (
                    <Badge
                      key={status}
                      variant="outline"
                      className={`text-xs gap-1 ${getStatusBadgeVariant(status)}`}
                    >
                      {getStatusIcon(status)}
                      {tCommon(
                        getProblemStatusDisplayName(status as ProblemStatus)
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Problem type section */}
            <div className="flex items-baseline gap-2">
              <FilterLabel icon={FileText} label={t('type')} />
              <div className="flex flex-wrap gap-1.5 min-w-0 flex-1">
                {problemTypes.map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {tCommon(getProblemTypeDisplayName(type))}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags section */}
            <div className="flex items-baseline gap-2">
              <FilterLabel icon={Tag} label={t('tagsFilter')} />
              {hasTags ? (
                <div className="flex flex-wrap gap-1.5 min-w-0 flex-1">
                  {resolvedTags.map(name => (
                    <Badge key={name} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic pt-0.5">
                  {t('allTags')}
                </span>
              )}
            </div>

            {/* Review date section */}
            {hasDaysSinceReview && (
              <div className="flex items-baseline gap-2">
                <FilterLabel icon={Calendar} label={t('reviewFilter')} />
                <div className="flex flex-wrap gap-1.5 min-w-0 flex-1">
                  <Badge variant="secondary" className="text-xs">
                    {t('notReviewedIn', {
                      n: filterConfig.days_since_review ?? 0,
                    })}
                  </Badge>
                </div>
              </div>
            )}

            {/* Include never-reviewed */}
            {filterConfig.include_never_reviewed && (
              <div className="flex items-baseline gap-2">
                <span className="w-[4.5rem] shrink-0" />
                <span className="text-xs text-muted-foreground italic pt-0.5">
                  {t('includesNeverReviewed')}
                </span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
