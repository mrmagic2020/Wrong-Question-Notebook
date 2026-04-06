'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProblemType, ProblemStatus } from '@/lib/schemas';
import {
  getProblemTypeDisplayName,
  getProblemStatusDisplayName,
  getStatusBadgeStyle,
  formatDisplayDate,
} from '@/lib/common-utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { Problem, TableMeta } from '@/lib/types';

// Tag capsules component
function TagCapsules({ tags }: { tags: { id: string; name: string }[] }) {
  if (!tags || tags.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map(tag => (
        <Badge key={tag.id} variant="outline" className="text-xs">
          {tag.name}
        </Badge>
      ))}
      {tags.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{tags.length - 3}
        </Badge>
      )}
    </div>
  );
}

const FALLBACK_T = (key: string) => {
  const fallbacks: Record<string, string> = {
    asc: 'Asc',
    desc: 'Desc',
    hide: 'Hide',
    titleColumn: 'Title',
    type: 'Type',
    tagsColumn: 'Tags',
    status: 'Status',
    dateCreatedColumn: 'Date Created',
    lastReviewedColumn: 'Last Reviewed',
    actionsColumn: 'Actions',
    openMenu: 'Open menu',
    problemIdCopied: 'Problem ID copied to clipboard',
    failedToCopyId: 'Failed to copy problem ID',
    copyProblemId: 'Copy problem ID',
    reviewProblem: 'Review problem',
    addToSet: 'Add to set',
    editProblem: 'Edit problem',
    deleteProblem: 'Delete problem',
    multipleChoiceType: 'Multiple Choice',
    shortAnswerType: 'Short Answer',
    extendedResponseType: 'Extended Response',
    wrongStatus: 'Wrong',
    needsReviewStatus: 'Needs Review',
    masteredStatus: 'Mastered',
  };
  return fallbacks[key] || key;
};

export function createColumns(
  t?: (key: string) => string
): ColumnDef<Problem>[] {
  const tr = t || FALLBACK_T;

  return [
    {
      id: 'select',
      header: ({ table }) => {
        const isAddToSetMode =
          (table.options.meta as TableMeta)?.isAddToSetMode || false;
        const selectableRows = table.getRowModel().rows.filter(row => {
          const problem = row.original as Problem;
          return !(isAddToSetMode && problem.isInSet);
        });

        return (
          <Checkbox
            checked={
              selectableRows.length > 0 &&
              (selectableRows.every(row => row.getIsSelected()) ||
                (selectableRows.some(row => row.getIsSelected()) &&
                  'indeterminate'))
            }
            onCheckedChange={value => {
              selectableRows.forEach(row => row.toggleSelected(!!value));
            }}
            aria-label="Select all"
          />
        );
      },
      cell: ({ row, table }) => {
        const problem = row.original as Problem;
        const isAddToSetMode =
          (table.options.meta as TableMeta)?.isAddToSetMode || false;
        const isDisabled = isAddToSetMode && problem.isInSet;

        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value =>
              !isDisabled && row.toggleSelected(!!value)
            }
            onClick={e => {
              e.stopPropagation();
              if (isDisabled) {
                e.preventDefault();
              }
            }}
            disabled={isDisabled}
            aria-label="Select row"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={tr('titleColumn')}
          t={tr}
        />
      ),
      cell: ({ row }) => {
        const title = row.getValue('title') as string;
        return (
          <div
            className="max-w-[32rem] truncate text-foreground px-2"
            title={title}
          >
            {title}
          </div>
        );
      },
    },
    {
      accessorKey: 'problem_type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={tr('type')} t={tr} />
      ),
      cell: ({ row }) => {
        const type = row.getValue('problem_type') as ProblemType;
        return (
          <div className="px-2">
            <Badge variant="outline">
              {tr(getProblemTypeDisplayName(type))}
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'tags',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={tr('tagsColumn')}
          t={tr}
        />
      ),
      cell: ({ row }) => {
        const tags = row.getValue('tags') as { id: string; name: string }[];
        return (
          <div className="px-2">
            <TagCapsules tags={tags || []} />
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const tags = row.getValue(id) as { id: string; name: string }[];
        if (!tags || !value.length) return true;
        return value.some((tagId: string) =>
          tags.some(tag => tag.id === tagId)
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={tr('status')} t={tr} />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as ProblemStatus;
        return (
          <div className="px-2">
            <Badge
              variant="outline"
              className={`${getStatusBadgeStyle(status)} font-medium`}
            >
              {tr(getProblemStatusDisplayName(status))}
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={tr('dateCreatedColumn')}
          t={tr}
        />
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue('created_at') as string;
        return (
          <div className="text-sm text-muted-foreground px-2">
            {formatDisplayDate(createdAt)}
          </div>
        );
      },
    },
    {
      accessorKey: 'last_reviewed_date',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={tr('lastReviewedColumn')}
          t={tr}
        />
      ),
      cell: ({ row }) => {
        const lastReviewedDate = row.getValue('last_reviewed_date') as string;
        return (
          <div className="text-sm text-muted-foreground px-2">
            {lastReviewedDate ? formatDisplayDate(lastReviewedDate) : '—'}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: tr('actionsColumn'),
      cell: ({ row, table }) => {
        const problem = row.original;
        const meta = table.options.meta as TableMeta;

        return (
          <div className="px-2">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={e => e.stopPropagation()}
                >
                  <span className="sr-only">{tr('openMenu')}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{tr('actionsColumn')}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={async e => {
                    e.stopPropagation();
                    try {
                      await navigator.clipboard.writeText(problem.id);
                      toast.success(tr('problemIdCopied'));
                    } catch {
                      toast.error(tr('failedToCopyId'));
                    }
                  }}
                >
                  {tr('copyProblemId')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!meta?.isAddToSetMode && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/subjects/${problem.subject_id}/problems/${problem.id}/review`}
                      onClick={e => e.stopPropagation()}
                    >
                      {tr('reviewProblem')}
                    </Link>
                  </DropdownMenuItem>
                )}
                {!meta?.isAddToSetMode && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      if (meta?.onAddToSet) {
                        meta.onAddToSet(problem);
                      }
                    }}
                  >
                    {tr('addToSet')}
                  </DropdownMenuItem>
                )}
                {!meta?.isAddToSetMode && meta?.onEdit && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      if (meta?.onEdit) {
                        meta.onEdit(problem);
                      }
                    }}
                  >
                    {tr('editProblem')}
                  </DropdownMenuItem>
                )}
                {!meta?.isAddToSetMode && meta?.onDelete && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      if (meta?.onDelete) {
                        meta.onDelete(problem.id, problem.title);
                      }
                    }}
                    className="text-destructive"
                  >
                    {tr('deleteProblem')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

// Default export (empty - use createColumns instead)
export const columns: ColumnDef<Problem>[] = [];

// Column header helper
function DataTableColumnHeader({
  column,
  title,
  t,
}: {
  column: any;
  title: string;
  t: (key: string) => string;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 px-2 lg:px-1">
          <span>{title}</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <ArrowUpDown className="mr-2 h-4 w-4" />
          {t('asc')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <ArrowUpDown className="mr-2 h-4 w-4" />
          {t('desc')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
          <EyeOff className="mr-2 h-4 w-4" />
          {t('hide')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
