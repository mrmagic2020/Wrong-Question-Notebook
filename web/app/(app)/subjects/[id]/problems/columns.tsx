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
} from '@/lib/display-utils';
import Link from 'next/link';
import { toast } from 'sonner';

// Problem type for the table
export type Problem = {
  id: string;
  title: string;
  problem_type: ProblemType;
  status: ProblemStatus;
  created_at: string;
  updated_at: string;
  subject_id: string;
  tags?: { id: string; name: string }[];
};

// Helper function to get status badge variant
const getStatusBadgeVariant = (
  status: ProblemStatus
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'wrong':
      return 'destructive';
    case 'needs_review':
      return 'secondary';
    case 'mastered':
      return 'default';
    default:
      return 'outline';
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 px-2 lg:px-3">
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
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
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
        <div className="max-w-[32rem] truncate text-foreground" title={title}>
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
      return <Badge variant="outline">{getProblemTypeDisplayName(type)}</Badge>;
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
      return <TagCapsules tags={tags || []} />;
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
        <Badge variant={getStatusBadgeVariant(status)}>
          {getProblemStatusDisplayName(status)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const problem = row.original;
      const meta = table.options.meta as any;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={async () => {
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
            <DropdownMenuItem asChild>
              <Link
                href={`/subjects/${problem.subject_id}/problems/${problem.id}/review`}
              >
                Review problem
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (meta?.onEdit) {
                  meta.onEdit(problem);
                }
              }}
            >
              Edit problem
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (meta?.onDelete) {
                  meta.onDelete(problem.id, problem.title);
                }
              }}
              className="text-destructive"
            >
              Delete problem
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
