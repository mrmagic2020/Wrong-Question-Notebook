'use client';

import { useState } from 'react';
import { BookPlus, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Problem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ProblemStatus } from '@/lib/schemas';
import {
  getProblemTypeDisplayName,
  getProblemStatusDisplayName,
  formatDisplayDate,
  getStatusBadgeStyle,
  getStatusBorderColor,
} from '@/lib/common-utils';
import { PROBLEM_CONSTANTS } from '@/lib/constants';
import Link from 'next/link';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = PROBLEM_CONSTANTS.MOBILE_CARD_LIST_PAGE_SIZE;

interface ProblemCardListProps {
  problems: Problem[];
  isSelectMode: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRowClick: (problem: Problem) => void;
  getRowHref?: (problem: Problem) => string;
  onEdit?: (problem: Problem) => void;
  onDelete: (problemId: string, problemTitle: string) => void;
  onAddToSet: (problem: Problem) => void;
  isAddToSetMode?: boolean;
  hideStatusStrip?: boolean;
  onCopyToNotebook?: (problem: Problem) => void;
}

export default function ProblemCardList({
  problems,
  isSelectMode,
  selectedIds,
  onSelectionChange,
  onRowClick,
  getRowHref,
  onEdit,
  onDelete,
  onAddToSet,
  isAddToSetMode = false,
  hideStatusStrip = false,
  onCopyToNotebook,
}: ProblemCardListProps) {
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);

  const visibleProblems = problems.slice(0, visibleCount);
  const hasMore = visibleCount < problems.length;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(x => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      {visibleProblems.map(problem => {
        const isSelected = selectedIds.includes(problem.id);
        const isMastered = problem.status === 'mastered';

        return (
          <div
            key={problem.id}
            className={cn(
              'rounded-xl border p-4 transition-colors',
              !hideStatusStrip &&
                `border-l-[4px] ${getStatusBorderColor(problem.status as ProblemStatus)}`,
              isMastered && !isAddToSetMode && !hideStatusStrip && 'opacity-80',
              !isSelectMode && 'cursor-pointer active:bg-muted/50'
            )}
            onClick={e => {
              if (isSelectMode) {
                toggleSelect(problem.id);
              } else if (
                getRowHref &&
                (e.ctrlKey || e.metaKey)
              ) {
                e.preventDefault();
                window.open(getRowHref(problem), '_blank');
              } else {
                onRowClick(problem);
              }
            }}
            onAuxClick={e => {
              if (e.button === 1 && getRowHref && !isSelectMode) {
                e.preventDefault();
                window.open(getRowHref(problem), '_blank');
              }
            }}
          >
            <div className="flex items-start gap-3">
              {isSelectMode && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(problem.id)}
                  onClick={e => e.stopPropagation()}
                  className="mt-0.5"
                />
              )}
              <div className="flex-1 min-w-0">
                {/* Title + status badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-foreground line-clamp-2 text-sm">
                    {problem.title}
                  </h4>
                  {!hideStatusStrip && (
                    <Badge
                      variant="outline"
                      className={`${getStatusBadgeStyle(problem.status as ProblemStatus)} font-medium flex-shrink-0 text-xs`}
                    >
                      {getProblemStatusDisplayName(
                        problem.status as ProblemStatus
                      )}
                    </Badge>
                  )}
                </div>

                {/* Type + tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {getProblemTypeDisplayName(problem.problem_type)}
                  </Badge>
                  {(problem.tags || []).slice(0, 2).map(tag => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                  {(problem.tags || []).length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{(problem.tags || []).length - 2}
                    </Badge>
                  )}
                </div>

                {/* Footer: date + menu */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDisplayDate(problem.created_at)}
                    {problem.last_reviewed_date &&
                      ` · Reviewed ${formatDisplayDate(problem.last_reviewed_date)}`}
                  </span>
                  {!isSelectMode && (
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={async e => {
                            e.stopPropagation();
                            try {
                              await navigator.clipboard.writeText(problem.id);
                              toast.success('Problem ID copied');
                            } catch {
                              toast.error('Failed to copy');
                            }
                          }}
                        >
                          Copy problem ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!isAddToSetMode && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/subjects/${problem.subject_id}/problems/${problem.id}/review`}
                              onClick={e => e.stopPropagation()}
                            >
                              Review problem
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {!isAddToSetMode && onCopyToNotebook && (
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              onCopyToNotebook(problem);
                            }}
                          >
                            <BookPlus className="h-4 w-4 mr-2" />
                            Add to Notebook
                          </DropdownMenuItem>
                        )}
                        {!isAddToSetMode && (
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              onAddToSet(problem);
                            }}
                          >
                            Add to set
                          </DropdownMenuItem>
                        )}
                        {!isAddToSetMode && onEdit && (
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              onEdit(problem);
                            }}
                          >
                            Edit problem
                          </DropdownMenuItem>
                        )}
                        {!isAddToSetMode && (
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              onDelete(problem.id, problem.title);
                            }}
                            className="text-destructive"
                          >
                            Delete problem
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Show more */}
      {problems.length > 0 && (
        <div className="flex flex-col items-center gap-1 pt-2">
          <span className="text-xs text-muted-foreground">
            Showing {Math.min(visibleCount, problems.length)} of{' '}
            {problems.length}
          </span>
          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
            >
              Show more
            </Button>
          )}
        </div>
      )}

      {problems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No results.
        </div>
      )}
    </div>
  );
}
