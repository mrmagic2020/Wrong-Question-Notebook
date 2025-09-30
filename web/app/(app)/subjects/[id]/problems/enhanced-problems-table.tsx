'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataTable } from './data-table';
import { columns, Problem } from './columns';
import CompactSearchFilter from './compact-search-filter';
import ProblemForm from './problem-form';
import { ProblemType } from '@/lib/schemas';
import { toast } from 'sonner';
import ConfirmationDialog from './confirmation-dialog';

type Tag = { id: string; name: string };

interface SearchFilters {
  searchText: string;
  problemTypes: ProblemType[];
  tagIds: string[];
  statuses: string[];
}

export default function EnhancedProblemsTable({
  initialProblems,
  initialTagsByProblem,
  subjectId,
  availableTags,
  onProblemDeleted = null,
  onProblemUpdated = null,
}: {
  initialProblems: any[];
  initialTagsByProblem: Map<string, any[]>;
  subjectId: string;
  availableTags: Tag[];
  onProblemDeleted?: ((problemId: string) => void) | null;
  onProblemUpdated?: ((updatedProblem: any) => void) | null;
}) {
  const [editingProblem, setEditingProblem] = useState<any | null>(null);
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [tagsByProblem, setTagsByProblem] = useState(initialTagsByProblem);
  const [error, setError] = useState<string | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search and filter state
  const [searchText, setSearchText] = useState('');
  const [problemTypes, setProblemTypes] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  // Bulk operations state
  const [selectedProblems, setSelectedProblems] = useState<Problem[]>([]);

  // Table instance state
  const [tableInstance, setTableInstance] = useState<any>(null);
  const [columnVisibilityKey, setColumnVisibilityKey] = useState(0);

  // Reset selection state
  const [resetSelection, setResetSelection] = useState(false);

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

  // Convert problems to the format expected by the data table (memoized)
  const tableProblems: Problem[] = useMemo(
    () =>
      problems.map(problem => ({
        id: problem.id,
        title: problem.title,
        problem_type: problem.problem_type,
        status: problem.status,
        created_at: problem.created_at,
        updated_at: problem.updated_at,
        last_reviewed_date: problem.last_reviewed_date,
        subject_id: problem.subject_id,
        tags: tagsByProblem.get(problem.id) || [],
      })),
    [problems, tagsByProblem]
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

  const handleEdit = async (problem: Problem) => {
    try {
      const response = await fetch(`/api/problems/${problem.id}`);
      const data = await response.json();
      if (data.data) {
        setEditingProblem(data.data);
      } else {
        setEditingProblem(problem);
      }
    } catch (error) {
      console.error('Failed to fetch problem details:', error);
      setEditingProblem(problem);
    }
  };

  const handleCancelEdit = () => {
    setEditingProblem(null);
  };

  const handleSearch = async (filters: SearchFilters) => {
    setError(null);
    setIsSearching(true);

    // Check if we have any active filters
    const hasActiveFilters =
      filters.searchText.trim() !== '' ||
      filters.problemTypes.length > 0 ||
      filters.tagIds.length > 0 ||
      filters.statuses.length > 0;

    setIsFiltered(hasActiveFilters);

    // If no active filters, reset to show all problems from initial state
    if (!hasActiveFilters) {
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
      const newTagsByProblem = new Map<string, any[]>();

      newProblems.forEach((problem: any) => {
        newTagsByProblem.set(problem.id, problem.tags || []);
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

  const handleProblemCreated = (newProblem: any) => {
    setProblems(prev => [newProblem, ...prev]);
    setTagsByProblem(prev => {
      const newMap = new Map(prev);
      newMap.set(newProblem.id, newProblem.tags || []);
      return newMap;
    });
  };

  const handleDeleteClick = (problemId: string, problemTitle: string) => {
    setDeleteDialog({
      open: true,
      problemId,
      problemTitle,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.problemId) return;

    try {
      const response = await fetch(`/api/problems/${deleteDialog.problemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete problem');
      }

      setProblems(prev => prev.filter(p => p.id !== deleteDialog.problemId));
      setTagsByProblem(prev => {
        const newMap = new Map(prev);
        newMap.delete(deleteDialog.problemId!);
        return newMap;
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

  const handleProblemUpdated = (updatedProblem: any) => {
    setProblems(prev =>
      prev.map(p => (p.id === updatedProblem.id ? updatedProblem : p))
    );
    setTagsByProblem(prev => {
      const newMap = new Map(prev);
      newMap.set(updatedProblem.id, updatedProblem.tags || []);
      return newMap;
    });

    if (onProblemUpdated) {
      onProblemUpdated(updatedProblem);
    }
  };

  const handleBulkDeleteClick = (problemIds: string[]) => {
    setBulkDeleteDialog({
      open: true,
      problemIds,
      count: problemIds.length,
    });
  };

  const handleConfirmBulkDelete = async () => {
    const { problemIds } = bulkDeleteDialog;

    try {
      // Use Promise.all for concurrent deletion instead of sequential
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

      // Update local state
      setProblems(prev => prev.filter(p => !problemIds.includes(p.id)));
      setTagsByProblem(prev => {
        const newMap = new Map(prev);
        problemIds.forEach(id => newMap.delete(id));
        return newMap;
      });

      // Notify parent component
      problemIds.forEach(id => {
        if (onProblemDeleted) {
          onProblemDeleted(id);
        }
      });

      setSelectedProblems([]);
      setResetSelection(true); // Trigger table selection reset
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

  const handleBulkEditTags = async (problemIds: string[]) => {
    try {
      // For now, we'll just show a success message
      // In a real implementation, this would open a tag selection dialog
      // and update the problems with the selected tags
      toast.success(
        `Tag editing for ${problemIds.length} problem${problemIds.length !== 1 ? 's' : ''} - Feature coming soon!`
      );

      setSelectedProblems([]);
      setResetSelection(true); // Trigger table selection reset
    } catch (err: any) {
      toast.error(`Failed to edit tags: ${err.message}`);
      console.error('Bulk tag edit error:', err);
    } finally {
    }
  };

  const handleSelectionChange = useCallback((selectedProblems: Problem[]) => {
    setSelectedProblems(selectedProblems);
  }, []);

  const handleRowClick = useCallback((problem: Problem) => {
    // Navigate to the review page
    window.location.href = `/subjects/${problem.subject_id}/problems/${problem.id}/review`;
  }, []);

  // Reset the resetSelection flag after it's been triggered
  useEffect(() => {
    if (resetSelection) {
      setResetSelection(false);
    }
  }, [resetSelection]);

  // Memoize the column visibility change callback to prevent infinite re-renders
  const handleColumnVisibilityChange = useCallback(() => {
    setColumnVisibilityKey(prev => prev + 1);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search and Filter with View Options */}
      <CompactSearchFilter
        onSearch={handleSearch}
        availableTags={availableTags}
        subjectId={subjectId}
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
        onBulkEditTags={handleBulkEditTags}
        onBulkDelete={handleBulkDeleteClick}
        onBulkEditTagsEnabled={true}
        onBulkDeleteEnabled={true}
        isSearching={isSearching}
      />

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error: {error}</p>
        </div>
      )}

      {/* Edit form (when editing) */}
      {editingProblem && (
        <div className="rounded-lg border bg-card p-4">
          <ProblemForm
            subjectId={subjectId}
            availableTags={availableTags}
            problem={editingProblem}
            onCancel={handleCancelEdit}
            onProblemCreated={handleProblemCreated}
            onProblemUpdated={handleProblemUpdated}
          />
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={tableProblems}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onRowClick={handleRowClick}
        availableTags={availableTags}
        onTableReady={setTableInstance}
        onSelectionChange={handleSelectionChange}
        resetSelection={resetSelection}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />

      {/* Individual Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={open => setDeleteDialog(prev => ({ ...prev, open }))}
        title="Delete Problem"
        description={`Are you sure you want to delete "${deleteDialog.problemTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={bulkDeleteDialog.open}
        onOpenChange={open => setBulkDeleteDialog(prev => ({ ...prev, open }))}
        title="Delete Problems"
        description={`Are you sure you want to delete ${bulkDeleteDialog.count} problem${bulkDeleteDialog.count !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={handleConfirmBulkDelete}
        variant="destructive"
      />
    </div>
  );
}
