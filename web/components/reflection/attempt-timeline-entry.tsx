'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ATTEMPT_CONSTANTS } from '@/lib/constants';
import { ERROR_CATEGORY_LABELS, ERROR_CATEGORY_COLORS } from '@/lib/constants';
import { Attempt, ErrorCategorisation } from '@/lib/types';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Pencil, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { TranslatorProp } from '@/i18n/types';
import { Button } from '@/components/ui/button';
import AttemptEditDialog from './attempt-edit-dialog';
import { ErrorCategoryEditor } from '@/components/insights/error-category-editor';

interface AttemptTimelineEntryProps {
  attempt: Attempt;
  isLast: boolean;
  onUpdated: () => void;
  initialCategorisation?: ErrorCategorisation | null;
}

function formatRelativeDate(dateString: string, t: TranslatorProp): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('justNow');
  if (diffMins < 60) return t('minutesAgo', { count: diffMins });
  if (diffHours < 24) return t('hoursAgo', { count: diffHours });
  if (diffDays < 7) return t('daysAgo', { count: diffDays });
  if (diffDays < 30) return t('weeksAgo', { count: Math.floor(diffDays / 7) });
  return date.toLocaleDateString();
}

function getCauseLabel(
  cause: string | undefined,
  isCorrect: boolean | null
): string | null {
  if (!cause) return null;
  const categories = isCorrect
    ? ATTEMPT_CONSTANTS.CAUSE_CATEGORIES.CORRECT
    : ATTEMPT_CONSTANTS.CAUSE_CATEGORIES.INCORRECT;
  const found = categories.find(c => c.value === cause);
  return found?.label || cause;
}

function getStatusBadge(status: string | null, t: TranslatorProp) {
  switch (status) {
    case 'wrong':
      return {
        label: t('wrong'),
        className:
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        dotColor: 'bg-red-500',
      };
    case 'needs_review':
      return {
        label: t('needsReview'),
        className:
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        dotColor: 'bg-yellow-500',
      };
    case 'mastered':
      return {
        label: t('mastered'),
        className:
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        dotColor: 'bg-green-500',
      };
    default:
      return {
        label: t('ungraded'),
        className:
          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        dotColor: 'bg-gray-400',
      };
  }
}

export default function AttemptTimelineEntry({
  attempt,
  isLast,
  onUpdated,
  initialCategorisation,
}: AttemptTimelineEntryProps) {
  const t = useTranslations('Review');
  const [editOpen, setEditOpen] = useState(false);
  const [categorisation, setCategorisation] =
    useState<ErrorCategorisation | null>(initialCategorisation ?? null);

  // Sync when parent passes updated initialCategorisation
  useEffect(() => {
    if (initialCategorisation !== undefined) {
      setCategorisation(initialCategorisation);
    }
  }, [initialCategorisation]);

  const fetchCategorisation = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/ai/categorise-error?attempt_id=${encodeURIComponent(attempt.id)}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.data) setCategorisation(json.data);
      }
    } catch {
      // Silently fail — categorisation is optional
    }
  }, [attempt.id]);

  useEffect(() => {
    // Skip fetch if parent already provided categorisation
    if (initialCategorisation !== undefined) return;
    if (
      attempt.selected_status === 'wrong' ||
      attempt.selected_status === 'needs_review'
    ) {
      fetchCategorisation();
    }
  }, [attempt.selected_status, fetchCategorisation, initialCategorisation]);

  const handleCategorisationSave = async (
    id: string,
    updates: { broad_category?: string; granular_tag?: string }
  ) => {
    try {
      const res = await fetch(`/api/ai/categorise-error/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(t('failedToSave'));
      const json = await res.json();
      if (json.data) setCategorisation(json.data);
    } catch {
      toast.error(t('failedToSaveClassification'));
    }
  };

  const handleCategorisationReset = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/categorise-error/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(t('failedToSave'));
      const json = await res.json();
      if (json.data) setCategorisation(json.data);
    } catch {
      toast.error(t('failedToResetClassification'));
    }
  };

  const badge = getStatusBadge(attempt.selected_status, t);

  const catColors = categorisation
    ? ERROR_CATEGORY_COLORS[categorisation.broad_category]
    : null;
  const catLabel = categorisation
    ? ERROR_CATEGORY_LABELS[categorisation.broad_category]
    : null;

  return (
    <>
      <div className="flex gap-3">
        {/* Timeline dot + line */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0',
              badge.dotColor
            )}
          />
          {!isLast && (
            <div className="w-px flex-1 bg-violet-200 dark:bg-violet-800/40 min-h-[24px]" />
          )}
        </div>

        {/* Entry content */}
        <div className="flex-1 pb-3 min-w-0">
          <Accordion type="single" collapsible>
            <AccordionItem value={attempt.id} className="border-none">
              <AccordionTrigger className="py-0 hover:no-underline">
                <div className="flex items-center gap-2 text-left flex-wrap">
                  {/* Status badge */}
                  <span
                    className={cn(
                      'text-xs font-medium px-1.5 py-0.5 rounded',
                      badge.className
                    )}
                  >
                    {badge.label}
                  </span>

                  {/* Self-assessed indicator */}
                  {attempt.is_self_assessed && (
                    <span title={t('selfAssessed')}>
                      <User className="w-3 h-3 text-violet-500" />
                    </span>
                  )}

                  {/* Error category badge — non-interactive label */}
                  {catColors && catLabel && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                        catColors.bg,
                        catColors.text
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          catColors.dot
                        )}
                      />
                      {catLabel}
                    </span>
                  )}

                  {/* Relative date */}
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(attempt.created_at, t)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-0">
                <div className="space-y-2 text-sm">
                  {/* AI diagnosis section */}
                  {categorisation && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-2.5 py-2 dark:bg-gray-800/40">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t('aiDiagnosis')}
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          {categorisation.granular_tag}
                        </p>
                      </div>
                      <ErrorCategoryEditor
                        categorisation={categorisation}
                        onSave={handleCategorisationSave}
                        onReset={handleCategorisationReset}
                      />
                    </div>
                  )}

                  {/* Submitted response */}
                  {attempt.submitted_answer != null &&
                    attempt.submitted_answer !== t('selfAssessed') && (
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t('response')}{' '}
                        </span>
                        {typeof attempt.submitted_answer === 'string'
                          ? attempt.submitted_answer
                          : JSON.stringify(attempt.submitted_answer)}
                      </p>
                    )}

                  {/* Cause */}
                  {attempt.cause && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {t('cause')}{' '}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {getCauseLabel(attempt.cause, attempt.is_correct)}
                      </span>
                    </div>
                  )}

                  {/* Reflection notes */}
                  {attempt.reflection_notes && (
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                      <span className="text-xs font-medium text-muted-foreground">
                        {t('notesLabel')}{' '}
                      </span>
                      {attempt.reflection_notes}
                    </p>
                  )}

                  {/* Edit button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                    onClick={e => {
                      e.stopPropagation();
                      setEditOpen(true);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                    {t('editAttempt')}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Edit dialog */}
      <AttemptEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        attempt={attempt}
        onSaved={onUpdated}
      />
    </>
  );
}
