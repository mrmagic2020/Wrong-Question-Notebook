'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from './data-table';
import { columns } from './columns';
import CompactSearchFilter from './compact-search-filter';
import { ProblemStatus, ProblemType } from '@/lib/schemas';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import ProblemSetCreationDialog from '@/components/problem-set-creation-dialog';
import AddToSetDialog from '@/components/add-to-set-dialog';
import { SearchFilters, Problem, SimpleTag, Tag } from '@/lib/types';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import ProblemCardList from './problem-card-list';

export default function EnhancedProblemsTable({
  initialProblems,
  initialTagsByProblem,
  subjectId,
  availableTags,
  onProblemDeleted = null,
  onEditProblem,
  onFiltersActiveChange,
  problemSetProblemIds = [],
  isAddToSetMode = false,
  targetProblemSetId = null,
}: {
  initialProblems: Problem[];
  initialTagsByProblem: Record<string, Tag[]>;
  subjectId: string;
  availableTags: SimpleTag[];
  onProblemDeleted?: ((problemId: string) => void) | null;
  onEditProblem?: (problem: Problem) => void;
  onFiltersActiveChange?: (active: boolean) => void;
  problemSetProblemIds?: string[];
  isAddToSetMode?: boolean;
  targetProblemSetId?: string | null;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [tagsByProblem, setTagsByProblem] = useState(initialTagsByProblem);
  const [error, setError] = useState<string | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search and filter state
  const [searchText, setSearchText] = useState('');
  const [problemTypes, setProblemTypes] = useState<ProblemType[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<ProblemStatus[]>([]);

  // Bulk operations state
  const [selectedProblems, setSelectedProblems] = useState<Problem[]>([]);

  // Table instance state
  const [tableInstance, setTableInstance] = useState<any>(null);
  const [columnVisibilityKey, setColumnVisibilityKey] = useState(0);

  // Reset selection state
  const [resetSelection, setResetSelection] = useState(false);

  // Mobile select mode
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    problemId: string | null;
    problemTitle: string;
  }>({
    open: false,
    problemId: null,
    problemTitle: '',
  });

  // Bulk delete confirmation dialog state
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{
    open: boolean;
    problemIds: string[];
    count: number;
  }>({
    open: false,
    problemIds: [],
    count: 0,
  });

  // Problem set creation dialog state
  const [createSetDialog, setCreateSetDialog] = useState<{
    open: boolean;
    problemIds: string[];
  }>({
    open: false,
    problemIds: [],
  });

  // Add to set dialog state
  const [addToSetDialog, setAddToSetDialog] = useState<{
    open: boolean;
    problem: Problem | null;
  }>({
    open: false,
    problem: null,
  });

  // Convert problems to the format expected by the data table (memoized)
  const tableProblems: Problem[] = useMemo(
    () =>
      problems.map(problem => ({
        id: problem.id,
        title: problem.title,
        content: problem.content || null,
        problem_type: problem.problem_type,
        correct_answer: problem.correct_answer || null,
        auto_mark: problem.auto_mark || false,
        status: problem.status,
        created_at: problem.created_at,
        updated_at: problem.updated_at,
        last_reviewed_date: problem.last_reviewed_date,
        subject_id: problem.subject_id,
        tags: tagsByProblem[problem.id] || [],
        isInSet: problemSetProblemIds.includes(problem.id),
      })),
    [problems, tagsByProblem, problemSetProblemIds]
  );

  // Only update from props when not in a filtered state
  useEffect(() => {
    if (!isFiltered) {
      setProblems(initialProblems);
    }
  }, [initialProblems, isFiltered]);

  useEffect(() => {
    if (!isFiltered) {
      setTagsByProblem(initialTagsByProblem);
    }
  }, [initialTagsByProblem, isFiltered]);

  // Track filter state changes for parent
  const hasActiveFilters =
    searchText.trim() !== '' ||
    problemTypes.length > 0 ||
    tagIds.length > 0 ||
    statuses.length > 0;

  useEffect(() => {
    onFiltersActiveChange?.(hasActiveFilters);
  }, [hasActiveFilters, onFiltersActiveChange]);

  const handleEdit = useCallback(
    (problem: Problem) => {
      if (onEditProblem) {
        onEditProblem(problem);
      }
    },
    [onEditProblem]
  );

  const handleSearch = async (filters: SearchFilters) => {
    setError(null);
    setIsSearching(true);

    // Check if we have any active filters
    const filtersActive =
      filters.searchText.trim() !== '' ||
      filters.problemTypes.length > 0 ||
      filters.tagIds.length > 0 ||
      filters.statuses.length > 0;

    setIsFiltered(filtersActive);

    // If no active filters, reset to show all problems from initial state
    if (!filtersActive) {
      setProblems(initialProblems);
      setTagsByProblem(initialTagsByProblem);
      setIsSearching(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set('subject_id', subjectId);

      if (filters.searchText.trim()) {
        params.set('search_text', filters.searchText.trim());
        params.set('search_title', 'true');
        params.set('search_content', 'true');
      }

      if (filters.problemTypes.length > 0) {
        params.set('problem_types', filters.problemTypes.join(','));
      }

      if (filters.tagIds.length > 0) {
        params.set('tag_ids', filters.tagIds.join(','));
      }

      if (filters.statuses.length > 0) {
        params.set('statuses', filters.statuses.join(','));
      }

      const response = await fetch(`/api/problems?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch problems');
      }

      // Update problems and tags
      const newProblems = data.data || [];
      const newTagsByProblem: Record<string, Tag[]> = {};

      newProblems.forEach((problem: any) => {
        newTagsByProblem[problem.id] = problem.tags || [];
      });

      setProblems(newProblems);
      setTagsByProblem(newTagsByProblem);
    } catch (err: any) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteClick = (problemId: string, problemTitle: string) => {
    setDeleteDialog({
      open: true,
      problemId,
      problemTitle,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.problemId) {
      toast.error('No problem selected for deletion');
      return;
    }

    try {
      const response = await fetch(`/api/problems/${deleteDialog.problemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete problem';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setProblems(prev => prev.filter(p => p.id !== deleteDialog.problemId));
      setTagsByProblem(prev => {
        const newTagsByProblem = { ...prev };
        delete newTagsByProblem[deleteDialog.problemId!];
        return newTagsByProblem;
      });

      if (onProblemDeleted) {
        onProblemDeleted(deleteDialog.problemId);
      }

      toast.success('Problem deleted successfully');
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to delete problem: ${err.message}`);
      console.error('Delete error:', err);
    } finally {
      setDeleteDialog({ open: false, problemId: null, problemTitle: '' });
    }
  };

  const handleBulkDeleteClick = (problemIds: string[]) => {
    setBulkDeleteDialog({
      open: true,
      problemIds,
      count: problemIds.length,
    });
  };

  const handleCreateSetClick = async (problemIds: string[]) => {
    if (isAddToSetMode && targetProblemSetId) {
      try {
        const response = await fetch(
          `/api/problem-sets/${targetProblemSetId}/problems`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ problem_ids: problemIds }),
          }
        );

        if (!response.ok) {
          let errorMessage = 'Failed to add problems to set';
          try {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } catch {
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        toast.success(`Added ${problemIds.length} problem(s) to the set`);

        setSelectedProblems([]);
        setResetSelection(true);

        setTimeout(() => {
          router.push(`/problem-sets/${targetProblemSetId}`);
        }, 1000);
      } catch (error) {
        console.error('Error adding problems to set:', error);
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to add problems to set'
        );
      }
    } else {
      setCreateSetDialog({
        open: true,
        problemIds,
      });
    }
  };

  const handleAddToSetClick = (problem: Problem) => {
    setAddToSetDialog({
      open: true,
      problem,
    });
  };

  const handleConfirmBulkDelete = async () => {
    const { problemIds } = bulkDeleteDialog;

    try {
      const deletePromises = problemIds.map(problemId =>
        fetch(`/api/problems/${problemId}`, {
          method: 'DELETE',
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to delete problem ${problemId}`);
          }
          return problemId;
        })
      );

      await Promise.all(deletePromises);

      setProblems(prev => prev.filter(p => !problemIds.includes(p.id)));
      setTagsByProblem(prev => {
        const newTagsByProblem = { ...prev };
        problemIds.forEach(id => delete newTagsByProblem[id]);
        return newTagsByProblem;
      });

      problemIds.forEach(id => {
        if (onProblemDeleted) {
          onProblemDeleted(id);
        }
      });

      setSelectedProblems([]);
      setResetSelection(true);
      toast.success(
        `Successfully deleted ${problemIds.length} problem${problemIds.length !== 1 ? 's' : ''}`
      );
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to delete problems: ${err.message}`);
      console.error('Bulk delete error:', err);
    } finally {
      setBulkDeleteDialog({ open: false, problemIds: [], count: 0 });
    }
  };

  const handleSelectionChange = useCallback((selected: Problem[]) => {
    setSelectedProblems(selected);
  }, []);

  const handleRowClick = useCallback(
    (problem: Problem) => {
      router.push(
        `/subjects/${problem.subject_id}/problems/${problem.id}/review`
      );
    },
    [router]
  );

  // Reset the resetSelection flag after it's been triggered
  useEffect(() => {
    if (resetSelection) {
      setResetSelection(false);
    }
  }, [resetSelection]);

  const handleColumnVisibilityChange = useCallback(() => {
    setColumnVisibilityKey(prev => prev + 1);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search and Filter with View Options */}
      <CompactSearchFilter
        onSearch={handleSearch}
        availableTags={availableTags}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        problemTypes={problemTypes}
        onProblemTypesChange={setProblemTypes}
        tagIds={tagIds}
        onTagIdsChange={setTagIds}
        statuses={statuses}
        onStatusesChange={setStatuses}
        table={tableInstance}
        columnVisibilityKey={columnVisibilityKey}
        selectedProblemIds={selectedProblems.map(p => p.id)}
        onBulkDelete={handleBulkDeleteClick}
        onBulkDeleteEnabled={!isAddToSetMode}
        onCreateSet={handleCreateSetClick}
        isSearching={isSearching}
        isAddToSetMode={isAddToSetMode}
        isSelectMode={isSelectMode}
        onSelectModeChange={setIsSelectMode}
      />

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error: {error}</p>
        </div>
      )}

      {/* Mobile card list or Desktop data table */}
      {isMobile ? (
        <ProblemCardList
          problems={tableProblems}
          isSelectMode={isSelectMode}
          selectedIds={selectedProblems.map(p => p.id)}
          onSelectionChange={ids => {
            const selected = tableProblems.filter(p => ids.includes(p.id));
            setSelectedProblems(selected);
          }}
          onRowClick={handleRowClick}
          onEdit={onEditProblem ? handleEdit : undefined}
          onDelete={handleDeleteClick}
          onAddToSet={handleAddToSetClick}
          isAddToSetMode={isAddToSetMode}
        />
      ) : (
        <DataTable
          columns={columns}
          data={tableProblems}
          onEdit={onEditProblem ? handleEdit : undefined}
          onDelete={handleDeleteClick}
          onAddToSet={handleAddToSetClick}
          onRowClick={handleRowClick}
          availableTags={availableTags}
          onTableReady={setTableInstance}
          onSelectionChange={handleSelectionChange}
          resetSelection={resetSelection}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          columnVisibilityStorageKey={`problems-table-column-visibility-${subjectId}`}
          isAddToSetMode={isAddToSetMode}
        />
      )}

      {/* Individual Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.open}
        title="Delete Problem"
        message={`Are you sure you want to delete "${deleteDialog.problemTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialog(prev => ({ ...prev, open: false }))}
        variant="destructive"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={bulkDeleteDialog.open}
        title="Delete Problems"
        message={`Are you sure you want to delete ${bulkDeleteDialog.count} problem${bulkDeleteDialog.count !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteDialog(prev => ({ ...prev, open: false }))}
        variant="destructive"
      />

      {/* Problem Set Creation Dialog */}
      <ProblemSetCreationDialog
        open={createSetDialog.open}
        onOpenChange={open => setCreateSetDialog(prev => ({ ...prev, open }))}
        subjectId={subjectId}
        selectedProblemIds={createSetDialog.problemIds}
        onSuccess={() => {
          setSelectedProblems([]);
          setResetSelection(true);
        }}
      />

      {/* Add to Set Dialog */}
      {addToSetDialog.problem && (
        <AddToSetDialog
          open={addToSetDialog.open}
          onOpenChange={open => setAddToSetDialog(prev => ({ ...prev, open }))}
          problemId={addToSetDialog.problem.id}
          subjectId={subjectId}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
