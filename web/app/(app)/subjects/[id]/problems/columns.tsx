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
  formatDisplayDate,
} from '@/lib/common-utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { Problem, TableMeta } from '@/lib/types';

// Helper function to get status badge styling with custom colors
export const getStatusBadgeStyle = (status: ProblemStatus): string => {
  switch (status) {
    case 'wrong':
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    case 'needs_review':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    case 'mastered':
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    default:
      return '';
  }
};

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

// Column header component with sorting and hiding options
function DataTableColumnHeader({
  column,
  title,
}: {
  column: any;
  title: string;
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
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Desc
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
          <EyeOff className="mr-2 h-4 w-4" />
          Hide
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<Problem>[] = [
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
          onCheckedChange={value => !isDisabled && row.toggleSelected(!!value)}
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
      <DataTableColumnHeader column={column} title="Title" />
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
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue('problem_type') as ProblemType;
      return (
        <div className="px-2">
          <Badge variant="outline">{getProblemTypeDisplayName(type)}</Badge>
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
      <DataTableColumnHeader column={column} title="Tags" />
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
      return value.some((tagId: string) => tags.some(tag => tag.id === tagId));
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as ProblemStatus;
      return (
        <div className="px-2">
          <Badge
            variant="outline"
            className={`${getStatusBadgeStyle(status)} font-medium`}
          >
            {getProblemStatusDisplayName(status)}
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
      <DataTableColumnHeader column={column} title="Date Created" />
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
      <DataTableColumnHeader column={column} title="Last Reviewed" />
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
    header: 'Actions',
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
                <span className="sr-only">Open menu</span>
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
                    toast.success('Problem ID copied to clipboard');
                  } catch {
                    toast.error('Failed to copy problem ID');
                  }
                }}
              >
                Copy problem ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!meta?.isAddToSetMode && (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/subjects/${problem.subject_id}/problems/${problem.id}/review`}
                    onClick={e => e.stopPropagation()}
                  >
                    Review problem
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
                  Add to set
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
                  Edit problem
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
                  Delete problem
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
