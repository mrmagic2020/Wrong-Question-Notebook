'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ATTEMPT_CONSTANTS } from '@/lib/constants';
import { Attempt } from '@/lib/types';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Pencil, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReflectionDialog from './reflection-dialog';

interface AttemptTimelineEntryProps {
  attempt: Attempt;
  isLast: boolean;
  onUpdated: () => void;
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
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

export default function AttemptTimelineEntry({
  attempt,
  isLast,
  onUpdated,
}: AttemptTimelineEntryProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="flex gap-3">
        {/* Timeline dot + line */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0',
              attempt.is_correct === true
                ? 'bg-green-500'
                : attempt.is_correct === false
                  ? 'bg-red-500'
                  : 'bg-gray-400'
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
                <div className="flex items-center gap-2 text-left">
                  {/* Result badge */}
                  <span
                    className={cn(
                      'text-xs font-medium px-1.5 py-0.5 rounded',
                      attempt.is_correct === true
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : attempt.is_correct === false
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    )}
                  >
                    {attempt.is_correct === true
                      ? 'Correct'
                      : attempt.is_correct === false
                        ? 'Incorrect'
                        : 'Ungraded'}
                  </span>

                  {/* Self-assessed indicator */}
                  {attempt.is_self_assessed && (
                    <span title="Self-assessed">
                      <User className="w-3 h-3 text-violet-500" />
                    </span>
                  )}

                  {/* Confidence dots */}
                  {attempt.confidence && (
                    <span
                      className="flex gap-0.5"
                      title={`Confidence: ${attempt.confidence}/5`}
                    >
                      {[1, 2, 3, 4, 5].map(i => (
                        <span
                          key={i}
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            i <= attempt.confidence!
                              ? 'bg-violet-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                          )}
                        />
                      ))}
                    </span>
                  )}

                  {/* Relative date */}
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(attempt.created_at)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-0">
                <div className="space-y-2 text-sm">
                  {/* Submitted response */}
                  {attempt.submitted_answer != null &&
                    attempt.submitted_answer !== 'Self-assessed' && (
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Response:{' '}
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
                        Cause:{' '}
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
                        Notes:{' '}
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
                    Edit reflection
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Edit reflection dialog */}
      <ReflectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        attemptId={attempt.id}
        isCorrect={attempt.is_correct}
        initialConfidence={attempt.confidence}
        initialCause={attempt.cause}
        initialNotes={attempt.reflection_notes}
        submittedAnswer={
          attempt.submitted_answer != null &&
          attempt.submitted_answer !== 'Self-assessed'
            ? typeof attempt.submitted_answer === 'string'
              ? attempt.submitted_answer
              : JSON.stringify(attempt.submitted_answer)
            : undefined
        }
        onSaved={onUpdated}
      />
    </>
  );
}
