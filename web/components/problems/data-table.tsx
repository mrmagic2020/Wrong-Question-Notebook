'use client';

import * as React from 'react';
import {
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useColumnVisibility } from '@/lib/hooks/useColumnVisibility';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Problem, DataTableProps } from '@/lib/types';
import { ProblemStatus } from '@/lib/schemas';
import { getStatusBorderColor } from '@/lib/common-utils';

export function DataTable<TData, TValue>({
  columns,
  data,
  onEdit,
  onDelete,
  onAddToSet,
  onRowClick,
  getRowHref,
  onTableReady,
  onSelectionChange,
  resetSelection = false,
  onColumnVisibilityChange,
  columnVisibilityStorageKey = 'problems-table-column-visibility',
  isAddToSetMode = false,
  hideStatusStrip = false,
  meta: externalMeta,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const { columnVisibility, setColumnVisibility } = useColumnVisibility({
    storageKey: columnVisibilityStorageKey,
  });
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    meta: {
      onEdit,
      onDelete,
      onAddToSet,
      isAddToSetMode,
      ...externalMeta,
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Notify parent when table is ready
  React.useEffect(() => {
    if (onTableReady) {
      onTableReady(table);
    }
  }, [table, onTableReady]);

  // Notify parent when selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const selectedProblems = selectedRows
        .map(row => row.original as Problem)
        .filter(problem => {
          // In add-to-set mode, filter out problems already in the set
          if (isAddToSetMode && problem.isInSet) {
            return false;
          }
          return true;
        });
      onSelectionChange(selectedProblems);
    }
  }, [rowSelection, table, onSelectionChange, isAddToSetMode]);

  // Reset selection when resetSelection prop changes
  React.useEffect(() => {
    if (resetSelection) {
      setRowSelection({});
    }
  }, [resetSelection]);

  // Notify parent when column visibility changes
  React.useEffect(() => {
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange();
    }
  }, [columnVisibility, onColumnVisibilityChange]);

  const handleRowClick = (
    e: React.MouseEvent,
    problem: Problem
  ) => {
    // Ctrl/Cmd+click → open in new tab
    if (getRowHref && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      window.open(getRowHref(problem), '_blank');
      return;
    }
    onRowClick?.(problem);
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => {
                const problem = row.original as Problem;
                const isInSet = problem.isInSet || false;

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={`
                      ${hideStatusStrip ? '' : `border-l-[3px] ${getStatusBorderColor(problem.status as ProblemStatus)}`}
                      ${onRowClick && !isAddToSetMode ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
                      ${isInSet && isAddToSetMode ? 'opacity-50 bg-muted/30' : ''}
                      ${problem.status === 'mastered' && !isAddToSetMode && !hideStatusStrip ? 'opacity-80' : ''}
                    `}
                    onClick={e => {
                      if (onRowClick && !isAddToSetMode) {
                        handleRowClick(e, problem);
                      }
                    }}
                    onAuxClick={e => {
                      if (
                        e.button === 1 &&
                        getRowHref &&
                        !isAddToSetMode
                      ) {
                        e.preventDefault();
                        window.open(getRowHref(problem), '_blank');
                      }
                    }}
                    data-onboarding-target={
                      !isAddToSetMode ? 'review-problem' : undefined
                    }
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length}{' '}
          {table.getFilteredRowModel().rows.length === 1 ? 'row' : 'rows'}{' '}
          selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
            >
              {[10, 20, 30, 40, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              {'<<'}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              {'<'}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              {'>'}
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              {'>>'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
