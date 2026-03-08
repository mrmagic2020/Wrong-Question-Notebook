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
import { toast } from 'sonner';
import { ProblemInSet } from '@/lib/types';

export type ProblemSetTableMeta = {
  onRemoveFromSet?: (problemIds: string[]) => void;
  problemSetId: string;
  isOwner: boolean;
  isSmart: boolean;
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

// Shared columns (used by both owner and viewer)
const titleColumn: ColumnDef<ProblemInSet> = {
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
};

const typeColumn: ColumnDef<ProblemInSet> = {
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
};

const tagsColumn: ColumnDef<ProblemInSet> = {
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
};

const createdAtColumn: ColumnDef<ProblemInSet> = {
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
};

// Owner-only columns
const selectColumn: ColumnDef<ProblemInSet> = {
  id: 'select',
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getFilteredSelectedRowModel().rows.length > 0 &&
        (table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate'))
      }
      onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={value => row.toggleSelected(!!value)}
      onClick={e => e.stopPropagation()}
      aria-label="Select row"
    />
  ),
  enableSorting: false,
  enableHiding: false,
};

const statusColumn: ColumnDef<ProblemInSet> = {
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
};

const lastReviewedColumn: ColumnDef<ProblemInSet> = {
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
};

// Actions column for owners
const ownerActionsColumn: ColumnDef<ProblemInSet> = {
  id: 'actions',
  header: 'Actions',
  cell: ({ row, table }) => {
    const problem = row.original;
    const meta = table.options.meta as ProblemSetTableMeta;

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
                  toast.success('Problem ID copied');
                } catch {
                  toast.error('Failed to copy');
                }
              }}
            >
              Copy problem ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                window.location.href = `/problem-sets/${meta.problemSetId}/review?problemId=${problem.id}`;
              }}
            >
              Review problem
            </DropdownMenuItem>
            {meta.isOwner && !meta.isSmart && (
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  meta.onRemoveFromSet?.([problem.id]);
                }}
                className="text-destructive"
              >
                Remove from set
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
  enableSorting: false,
  enableHiding: false,
};

// Actions column for viewers
const viewerActionsColumn: ColumnDef<ProblemInSet> = {
  id: 'actions',
  header: 'Actions',
  cell: ({ row, table }) => {
    const problem = row.original;
    const meta = table.options.meta as ProblemSetTableMeta;

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
                  toast.success('Problem ID copied');
                } catch {
                  toast.error('Failed to copy');
                }
              }}
            >
              Copy problem ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                window.location.href = `/problem-sets/${meta.problemSetId}/review?problemId=${problem.id}`;
              }}
            >
              Review problem
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
  enableSorting: false,
  enableHiding: false,
};

export const ownerColumns: ColumnDef<ProblemInSet>[] = [
  selectColumn,
  titleColumn,
  typeColumn,
  tagsColumn,
  statusColumn,
  createdAtColumn,
  lastReviewedColumn,
  ownerActionsColumn,
];

export const viewerColumns: ColumnDef<ProblemInSet>[] = [
  titleColumn,
  typeColumn,
  tagsColumn,
  createdAtColumn,
  viewerActionsColumn,
];
