'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { DataTable } from '@/components/problems/data-table';
import CompactSearchFilter from '@/components/problems/compact-search-filter';
import ProblemCardList from '@/components/problems/problem-card-list';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { useFilterParams } from '@/lib/hooks/useFilterParams';
import {
  ProblemInSet,
  Problem,
  SimpleTag,
  SearchFilters,
  TagFilterMode,
} from '@/lib/types';
import { ProblemType, ProblemStatus } from '@/lib/schemas';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import CopyProblemDialog from '@/components/copy-problem-dialog';
import { toast } from 'sonner';
import {
  ownerColumns,
  viewerColumns,
  ProblemSetTableMeta,
} from './problem-set-columns';

interface ProblemSetProblemsTableProps {
  problems: ProblemInSet[];
  problemSetId: string;
  isOwner: boolean;
  isSmart: boolean;
  onProblemsRemoved: (problemIds: string[]) => void;
  allowCopying?: boolean;
  isAuthenticated?: boolean;
}

export default function ProblemSetProblemsTable({
  problems,
  problemSetId,
  isOwner,
  isSmart,
  onProblemsRemoved,
  allowCopying,
  isAuthenticated,
}: ProblemSetProblemsTableProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { initialFilters, updateUrl } = useFilterParams();

  // Filter state — initialised from URL params
  const [searchText, setSearchText] = useState(initialFilters.searchText);
  const [problemTypes, setProblemTypes] = useState<ProblemType[]>(
    initialFilters.problemTypes
  );
  const [tagIds, setTagIds] = useState<string[]>(initialFilters.tagIds);
  const [tagFilterMode, setTagFilterMode] = useState<TagFilterMode>(
    initialFilters.tagFilterMode
  );
  const [statuses, setStatuses] = useState<ProblemStatus[]>(
    initialFilters.statuses
  );

  // Table state
  const [tableInstance, setTableInstance] = useState<any>(null);
  const [columnVisibilityKey, setColumnVisibilityKey] = useState(0);
  const [selectedProblems, setSelectedProblems] = useState<Problem[]>([]);
  const [resetSelection, setResetSelection] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Remove dialog
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    problemIds: string[];
    count: number;
  }>({ open: false, problemIds: [], count: 0 });

  // Mobile copy-to-notebook dialog
  const [copyDialog, setCopyDialog] = useState<{
    open: boolean;
    problemId: string;
    problemTitle: string;
  }>({ open: false, problemId: '', problemTitle: '' });

  const showCopyAction = !!allowCopying && !!isAuthenticated && !isOwner;

  // Derive available tags from loaded problems
  const availableTags: SimpleTag[] = useMemo(() => {
    const tagMap = new Map<string, SimpleTag>();
    problems.forEach(p => {
      p.tags?.forEach(tag => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, { id: tag.id, name: tag.name });
        }
      });
    });
    return Array.from(tagMap.values());
  }, [problems]);

  // Client-side filtering
  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      // Text search
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchContent = p.content?.toLowerCase().includes(q);
        const matchTags = p.tags?.some(tag =>
          tag.name.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchContent && !matchTags) return false;
      }

      // Type filter
      if (problemTypes.length > 0 && !problemTypes.includes(p.problem_type)) {
        return false;
      }

      // Tag filter
      if (tagIds.length > 0) {
        const pTagIds = p.tags?.map(t => t.id) || [];
        if (tagFilterMode === 'all') {
          if (!tagIds.every(id => pTagIds.includes(id))) return false;
        } else {
          if (!tagIds.some(id => pTagIds.includes(id))) return false;
        }
      }

      // Status filter (owner only)
      if (
        isOwner &&
        statuses.length > 0 &&
        !statuses.includes(p.status as ProblemStatus)
      ) {
        return false;
      }

      return true;
    });
  }, [
    problems,
    searchText,
    problemTypes,
    tagIds,
    tagFilterMode,
    statuses,
    isOwner,
  ]);

  const columns = isOwner ? ownerColumns : viewerColumns;

  const handleSearch = useCallback(
    (filters: SearchFilters) => {
      // Actual filtering happens in filteredProblems memo; sync URL here
      updateUrl(filters);
    },
    [updateUrl]
  );

  const getRowHref = useCallback(
    (problem: Problem) =>
      `/problem-sets/${problemSetId}/review?problemId=${problem.id}`,
    [problemSetId]
  );

  const handleRowClick = useCallback(
    (problem: Problem) => {
      router.push(getRowHref(problem));
    },
    [router, getRowHref]
  );

  const handleSelectionChange = useCallback((selected: Problem[]) => {
    setSelectedProblems(selected);
  }, []);

  const handleColumnVisibilityChange = useCallback(() => {
    setColumnVisibilityKey(prev => prev + 1);
  }, []);

  const handleRemoveFromSet = useCallback((problemIds: string[]) => {
    setRemoveDialog({
      open: true,
      problemIds,
      count: problemIds.length,
    });
  }, []);

  const handleConfirmRemove = async () => {
    const { problemIds } = removeDialog;
    if (!problemIds.length) return;

    try {
      const response = await fetch(
        `/api/problem-sets/${problemSetId}/problems`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problem_ids: problemIds }),
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to remove problems from set';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      onProblemsRemoved(problemIds);
      setSelectedProblems([]);
      setResetSelection(true);
      toast.success(
        `Removed ${problemIds.length} problem${problemIds.length !== 1 ? 's' : ''} from set`
      );
    } catch (error) {
      console.error('Error removing problems:', error);
      toast.error('Failed to remove problems from set');
    } finally {
      setRemoveDialog({ open: false, problemIds: [], count: 0 });
    }
  };

  // Reset selection flag
  useEffect(() => {
    if (resetSelection) {
      setResetSelection(false);
    }
  }, [resetSelection]);

  // Table meta for columns
  const tableMeta: ProblemSetTableMeta = useMemo(
    () => ({
      onRemoveFromSet: handleRemoveFromSet,
      problemSetId,
      isOwner,
      isSmart,
      allowCopying,
      isAuthenticated,
    }),
    [
      handleRemoveFromSet,
      problemSetId,
      isOwner,
      isSmart,
      allowCopying,
      isAuthenticated,
    ]
  );

  return (
    <div className="space-y-4">
      <CompactSearchFilter
        onSearch={handleSearch}
        availableTags={availableTags}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        problemTypes={problemTypes}
        onProblemTypesChange={setProblemTypes}
        tagIds={tagIds}
        onTagIdsChange={setTagIds}
        tagFilterMode={tagFilterMode}
        onTagFilterModeChange={setTagFilterMode}
        statuses={statuses}
        onStatusesChange={setStatuses}
        table={tableInstance}
        columnVisibilityKey={columnVisibilityKey}
        selectedProblemIds={selectedProblems.map(p => p.id)}
        onBulkDelete={isOwner && !isSmart ? handleRemoveFromSet : undefined}
        onBulkDeleteEnabled={isOwner && !isSmart}
        isSelectMode={isSelectMode}
        onSelectModeChange={isOwner && !isSmart ? setIsSelectMode : undefined}
        hideStatusFilter={!isOwner}
      />

      {isMobile ? (
        <ProblemCardList
          problems={filteredProblems as Problem[]}
          isSelectMode={isSelectMode}
          selectedIds={selectedProblems.map(p => p.id)}
          onSelectionChange={ids => {
            const selected = filteredProblems.filter(p => ids.includes(p.id));
            setSelectedProblems(selected as Problem[]);
          }}
          onRowClick={handleRowClick}
          getRowHref={getRowHref}
          hideStatusStrip={!isOwner}
          onDelete={
            isOwner && !isSmart
              ? (id: string) => handleRemoveFromSet([id])
              : () => {}
          }
          onAddToSet={() => {}}
          onCopyToNotebook={
            showCopyAction
              ? (problem: Problem) =>
                  setCopyDialog({
                    open: true,
                    problemId: problem.id,
                    problemTitle: problem.title,
                  })
              : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns as any}
          data={filteredProblems}
          onRowClick={handleRowClick}
          getRowHref={getRowHref}
          availableTags={availableTags}
          onTableReady={setTableInstance}
          onSelectionChange={isOwner ? handleSelectionChange : undefined}
          resetSelection={resetSelection}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          columnVisibilityStorageKey={`problem-set-table-${problemSetId}`}
          hideStatusStrip={!isOwner}
          meta={tableMeta as any}
        />
      )}

      {/* Remove Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={removeDialog.open}
        onCancel={() => setRemoveDialog(prev => ({ ...prev, open: false }))}
        onConfirm={handleConfirmRemove}
        title="Remove Problems from Set"
        message={`Are you sure you want to remove ${removeDialog.count} problem${removeDialog.count !== 1 ? 's' : ''} from this problem set?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Mobile Copy to Notebook Dialog */}
      {showCopyAction && copyDialog.problemId && (
        <CopyProblemDialog
          open={copyDialog.open}
          onOpenChange={open => setCopyDialog(prev => ({ ...prev, open }))}
          problemSetId={problemSetId}
          problemId={copyDialog.problemId}
          problemTitle={copyDialog.problemTitle}
        />
      )}
    </div>
  );
}
