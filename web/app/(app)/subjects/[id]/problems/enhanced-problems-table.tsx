'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/problems/data-table';
import { createColumns } from './columns';
import CompactSearchFilter from '@/components/problems/compact-search-filter';
import { ProblemStatus, ProblemType } from '@/lib/schemas';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import ProblemSetCreationDialog from '@/components/problem-set-creation-dialog';
import AddToSetDialog from '@/components/add-to-set-dialog';
import {
  SearchFilters,
  Problem,
  SimpleTag,
  Tag,
  TagFilterMode,
} from '@/lib/types';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { useFilterParams } from '@/lib/hooks/useFilterParams';
import { confirmUnsavedNavigation } from '@/lib/hooks/useUnsavedChanges';
import ProblemCardList from '@/components/problems/problem-card-list';

const FALLBACK_T = (key: string, params?: Record<string, string | number>) => {
  const fallbacks: Record<string, string> = {
    'deleteProblemTitle': 'Delete Problem',
    'deleteProblemMessage': 'Are you sure you want to delete "{title}"? This action cannot be undone.',
    'deleteProblemsTitle': 'Delete Problems',
    'deleteProblemsMessage': 'Are you sure you want to delete {count} problem(s)? This action cannot be undone.',
    'delete': 'Delete',
    'deleteAll': 'Delete All',
    'cancel': 'Cancel',
    'noProblemSelectedForDeletion': 'No problem selected for deletion',
    'problemDeletedSuccessfully': 'Problem deleted successfully',
    'problemsDeletedSuccessfully': '{count} problem(s) deleted successfully',
    'failedToDeleteProblem': 'Failed to delete problem: {error}',
    'addedProblemsToSet': 'Added {count} problem(s) to the set',
    'failedToAddProblemsToSet': 'Failed to add problems to set',
  };

  let text = fallbacks[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
};

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
  const { initialFilters, updateUrl } = useFilterParams();
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [tagsByProblem, setTagsByProblem] = useState(initialTagsByProblem);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state — initialised from URL params
  const [searchText, setSearchText] = useState(initialFilters.searchText);
  const [problemTypes, setProblemTypes] = useState<ProblemType[]>(
    initialFilters.problemTypes
  );
  const [tagIds, setTagIds] = useState<string[]>(initialFilters.tagIds);
  const [statuses, setStatuses] = useState<ProblemStatus[]>(
    initialFilters.statuses
  );
  const [tagFilterMode, setTagFilterMode] = useState<TagFilterMode>(
    initialFilters.tagFilterMode
  );

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

  // Client-side filtering — no API call needed
  const filteredProblems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const hasSearch = q.length > 0;
    const typeSet = problemTypes.length > 0 ? new Set(problemTypes) : null;
    const statusSet = statuses.length > 0 ? new Set(statuses) : null;
    const hasTagFilter = tagIds.length > 0;
    const tagIdSet = hasTagFilter ? new Set(tagIds) : null;

    return problems.filter(p => {
      // Text search (title, content, solution_text, tag names)
      if (hasSearch) {
        const pTags = tagsByProblem[p.id] || [];
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchContent = p.content?.toLowerCase().includes(q);
        const matchSolution = p.solution_text?.toLowerCase().includes(q);
        const matchTags = pTags.some(tag => tag.name.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchSolution && !matchTags)
          return false;
      }

      // Type filter
      if (typeSet && !typeSet.has(p.problem_type)) return false;

      // Tag filter
      if (hasTagFilter && tagIdSet) {
        const pTagIdSet = new Set((tagsByProblem[p.id] || []).map(t => t.id));
        if (tagFilterMode === 'all') {
          for (const id of tagIds) {
            if (!pTagIdSet.has(id)) return false;
          }
        } else {
          let hasAny = false;
          for (const id of tagIds) {
            if (pTagIdSet.has(id)) {
              hasAny = true;
              break;
            }
          }
          if (!hasAny) return false;
        }
      }

      // Status filter
      if (statusSet && !statusSet.has(p.status)) return false;

      return true;
    });
  }, [
    problems,
    tagsByProblem,
    searchText,
    problemTypes,
    tagIds,
    tagFilterMode,
    statuses,
  ]);

  // Convert filtered problems to the format expected by the data table
  const tableProblems: Problem[] = useMemo(
    () =>
      filteredProblems.map(problem => ({
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
    [filteredProblems, tagsByProblem, problemSetProblemIds]
  );

  // Keep problems in sync with props
  useEffect(() => {
    setProblems(initialProblems);
  }, [initialProblems]);

  useEffect(() => {
    setTagsByProblem(initialTagsByProblem);
  }, [initialTagsByProblem]);

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

  const handleSearch = useCallback(
    (filters: SearchFilters) => {
      // Filtering happens in filteredProblems memo; just sync URL here
      updateUrl(filters);
    },
    [updateUrl]
  );

  const handleDeleteClick = (problemId: string, problemTitle: string) => {
    setDeleteDialog({
      open: true,
      problemId,
      problemTitle,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.problemId) {
      toast.error(FALLBACK_T('noProblemSelectedForDeletion'));
      return;
    }

    try {
      const response = await fetch(`/api/problems/${deleteDialog.problemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = FALLBACK_T('failedToDeleteProblem', { error: '' });
        try {
          const error = await response.json();
          errorMessage = FALLBACK_T('failedToDeleteProblem', { error: error.message || response.statusText });
        } catch {
          errorMessage = FALLBACK_T('failedToDeleteProblem', { error: response.statusText });
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

      toast.success(FALLBACK_T('problemDeletedSuccessfully'));
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
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

        toast.success(FALLBACK_T('addedProblemsToSet', { count: problemIds.length }));

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
            : FALLBACK_T('failedToAddProblemsToSet')
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
        FALLBACK_T('problemsDeletedSuccessfully', { count: problemIds.length })
      );
    } catch (err: any) {
      setError(err.message);
      toast.error(FALLBACK_T('failedToDeleteProblem', { error: err.message }));
      console.error('Bulk delete error:', err);
    } finally {
      setBulkDeleteDialog({ open: false, problemIds: [], count: 0 });
    }
  };

  const handleSelectionChange = useCallback((selected: Problem[]) => {
    setSelectedProblems(selected);
  }, []);

  const getRowHref = useCallback(
    (problem: Problem) =>
      `/subjects/${problem.subject_id}/problems/${problem.id}/review`,
    []
  );

  const handleRowClick = useCallback(
    (problem: Problem) => {
      if (!confirmUnsavedNavigation()) return;
      router.push(getRowHref(problem));
    },
    [router, getRowHref]
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
        tagFilterMode={tagFilterMode}
        onTagFilterModeChange={setTagFilterMode}
        statuses={statuses}
        onStatusesChange={setStatuses}
        table={tableInstance}
        columnVisibilityKey={columnVisibilityKey}
        selectedProblemIds={selectedProblems.map(p => p.id)}
        onBulkDelete={handleBulkDeleteClick}
        onBulkDeleteEnabled={!isAddToSetMode}
        onCreateSet={handleCreateSetClick}
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
          getRowHref={getRowHref}
          onEdit={onEditProblem ? handleEdit : undefined}
          onDelete={handleDeleteClick}
          onAddToSet={handleAddToSetClick}
          isAddToSetMode={isAddToSetMode}
        />
      ) : (
        <DataTable
          columns={createColumns()}
          data={tableProblems}
          onEdit={onEditProblem ? handleEdit : undefined}
          onDelete={handleDeleteClick}
          onAddToSet={handleAddToSetClick}
          onRowClick={handleRowClick}
          getRowHref={getRowHref}
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
        title={FALLBACK_T('deleteProblemTitle')}
        message={FALLBACK_T('deleteProblemMessage', { title: deleteDialog.problemTitle })}
        confirmText={FALLBACK_T('delete')}
        cancelText={FALLBACK_T('cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialog(prev => ({ ...prev, open: false }))}
        variant="destructive"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={bulkDeleteDialog.open}
        title={FALLBACK_T('deleteProblemsTitle')}
        message={FALLBACK_T('deleteProblemsMessage', { count: bulkDeleteDialog.count })}
        confirmText={FALLBACK_T('deleteAll')}
        cancelText={FALLBACK_T('cancel')}
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
