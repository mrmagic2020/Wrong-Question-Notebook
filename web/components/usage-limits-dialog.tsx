'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BarChart3,
  BookOpen,
  Brain,
  ChevronDown,
  FileText,
  FolderOpen,
  HardDrive,
  Loader2,
  Tag,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatBytes } from '@/lib/format-utils';
import { CONTENT_LIMIT_CONSTANTS } from '@/lib/constants';
import type { ContentLimitResult } from '@/lib/content-limits';

interface QuotaCheckResult {
  allowed: boolean;
  current_usage: number;
  daily_limit: number;
  remaining: number;
}

interface UsageData {
  content_limits: ContentLimitResult[];
  daily_quotas: {
    ai_extraction: QuotaCheckResult;
    ai_categorisation: QuotaCheckResult;
  };
}

interface UsageLimitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CONTENT_LIMIT_ICONS: Record<string, LucideIcon> = {
  storage_bytes: HardDrive,
  subjects: BookOpen,
  problems_per_subject: FileText,
  problem_sets: FolderOpen,
  tags_per_subject: Tag,
};

function getProgressColor(ratio: number): string {
  if (ratio >= 1) return 'bg-rose-500 dark:bg-rose-400';
  if (ratio >= CONTENT_LIMIT_CONSTANTS.WARNING_THRESHOLD)
    return 'bg-amber-500 dark:bg-amber-400';
  return 'bg-emerald-500 dark:bg-emerald-400';
}

function ProgressBar({ current, limit }: { current: number; limit: number }) {
  const ratio = limit > 0 ? current / limit : 0;
  const widthPercent = Math.min(ratio * 100, 100);

  return (
    <div className="mt-1.5 h-2 w-full rounded-full bg-gray-200 dark:bg-stone-700">
      <div
        className={`h-2 rounded-full transition-all ${getProgressColor(ratio)}`}
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
}

function ContentLimitRow({ item }: { item: ContentLimitResult }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CONTENT_LIMIT_ICONS[item.resource_type] ?? FileText;
  const label =
    CONTENT_LIMIT_CONSTANTS.LABELS[item.resource_type] ?? item.resource_type;
  const isStorage = item.resource_type === 'storage_bytes';
  const hasPerSubject = item.per_subject && item.per_subject.length > 0;

  // Find highest-usage subject
  const highestSubject = hasPerSubject
    ? item.per_subject!.reduce(
        (max, s) => (s.current > max.current ? s : max),
        item.per_subject![0]
      )
    : null;

  const formatValue = (val: number) => (isStorage ? formatBytes(val) : val);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatValue(item.current)} / {formatValue(item.limit)}
          </span>
          {hasPerSubject && (
            <button
              onClick={() => setExpanded(!expanded)}
              aria-label={
                expanded
                  ? 'Hide per-notebook breakdown'
                  : 'Show per-notebook breakdown'
              }
              aria-expanded={expanded}
              aria-controls={`breakdown-${item.resource_type}`}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </div>
      <ProgressBar current={item.current} limit={item.limit} />
      {hasPerSubject && !expanded && highestSubject && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Highest: {highestSubject.subject_name} ({highestSubject.current})
        </p>
      )}
      {hasPerSubject && expanded && (
        <div id={`breakdown-${item.resource_type}`} className="mt-2 space-y-1 pl-6">
          {item.per_subject!.map(s => (
            <div
              key={s.subject_id}
              className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
            >
              <span>{s.subject_name}</span>
              <span className="font-medium">{s.current}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuotaRow({
  icon: Icon,
  label,
  quota,
}: {
  icon: LucideIcon;
  label: string;
  quota: QuotaCheckResult;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {quota.current_usage} / {quota.daily_limit} today
        </span>
      </div>
      <ProgressBar current={quota.current_usage} limit={quota.daily_limit} />
    </div>
  );
}

export function UsageLimitsDialog({
  open,
  onOpenChange,
}: UsageLimitsDialogProps) {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    fetch('/api/usage')
      .then(res => res.json())
      .then(json => {
        setData(json.data);
      })
      .catch(err => {
        console.error('Failed to fetch usage limits:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Usage & Limits
          </DialogTitle>
        </DialogHeader>

        {loading || !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Content Limits */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Content Limits
              </h3>
              <div className="space-y-4">
                {data.content_limits.map(item => (
                  <ContentLimitRow key={item.resource_type} item={item} />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-amber-200/30 dark:border-gray-800" />

            {/* Daily Quotas */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Daily Quotas
              </h3>
              <div className="space-y-4">
                <QuotaRow
                  icon={Zap}
                  label="AI Extraction"
                  quota={data.daily_quotas.ai_extraction}
                />
                <QuotaRow
                  icon={Brain}
                  label="AI Categorisation"
                  quota={data.daily_quotas.ai_categorisation}
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
