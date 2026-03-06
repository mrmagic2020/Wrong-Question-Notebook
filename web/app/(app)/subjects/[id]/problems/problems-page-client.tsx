'use client';

import { useState, useCallback, useEffect } from 'react';
import ProblemForm from './problem-form';
import EnhancedProblemsTable from './enhanced-problems-table';
import StatsStrip from './stats-strip';
import EmptyState from './empty-state';
import ProblemFab from './problem-fab';
import { ProblemsPageClientProps, Problem } from '@/lib/types';
import { useOnboarding } from '@/components/onboarding/onboarding-provider';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { toast } from 'sonner';

type FormMode = 'closed' | 'create-manual' | 'create-scan' | 'edit';

export default function ProblemsPageClient({
  initialProblems,
  initialTagsByProblem,
  subjectId,
  availableTags,
}: ProblemsPageClientProps) {
  const [problems, setProblems] = useState(initialProblems);
  const [tagsByProblem, setTagsByProblem] = useState(initialTagsByProblem);
  const { refreshChecklistStatus } = useOnboarding();

  const [formMode, setFormMode] = useState<FormMode>('closed');
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Confirmation dialog for switching from create to edit
  const [switchDialog, setSwitchDialog] = useState<{
    open: boolean;
    pendingProblem: Problem | null;
  }>({ open: false, pendingProblem: null });

  const handleAddManually = useCallback(() => {
    setFormMode('create-manual');
    setEditingProblem(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddScan = useCallback(() => {
    setFormMode('create-scan');
    setEditingProblem(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const fetchAndOpenEdit = useCallback(async (problem: Problem) => {
    try {
      const response = await fetch(`/api/problems/${problem.id}`);
      if (!response.ok) {
        throw new Error('Failed to load problem details');
      }
      const data = await response.json();
      setEditingProblem(data.data || problem);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load problem details'
      );
      setEditingProblem(problem);
    }
    setFormMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleEditProblem = useCallback(
    async (problem: Problem) => {
      if (formMode === 'create-manual' || formMode === 'create-scan') {
        setSwitchDialog({ open: true, pendingProblem: problem });
        return;
      }
      fetchAndOpenEdit(problem);
    },
    [formMode, fetchAndOpenEdit]
  );

  const handleConfirmSwitch = useCallback(async () => {
    const problem = switchDialog.pendingProblem;
    setSwitchDialog({ open: false, pendingProblem: null });
    if (!problem) return;
    fetchAndOpenEdit(problem);
  }, [switchDialog.pendingProblem, fetchAndOpenEdit]);

  const handleCloseForm = useCallback(() => {
    setFormMode('closed');
    setEditingProblem(null);
  }, []);

  const handleProblemCreated = useCallback(
    (newProblem: Problem) => {
      setProblems(prev => [newProblem, ...prev]);
      setTagsByProblem(prev => ({
        ...prev,
        [newProblem.id]: newProblem.tags || [],
      }));
      setFormMode('closed');
      setEditingProblem(null);
      refreshChecklistStatus();
    },
    [refreshChecklistStatus]
  );

  const handleProblemDeleted = useCallback((problemId: string) => {
    setProblems(prev => prev.filter(p => p.id !== problemId));
    setTagsByProblem(prev => {
      const newTagsByProblem = { ...prev };
      delete newTagsByProblem[problemId];
      return newTagsByProblem;
    });
  }, []);

  const handleProblemUpdated = useCallback((updatedProblem: Problem) => {
    setProblems(prev =>
      prev.map(p => (p.id === updatedProblem.id ? updatedProblem : p))
    );
    setTagsByProblem(prev => ({
      ...prev,
      [updatedProblem.id]: updatedProblem.tags || [],
    }));
    setFormMode('closed');
    setEditingProblem(null);
  }, []);

  const handleFiltersActiveChange = useCallback((active: boolean) => {
    setHasActiveFilters(active);
  }, []);

  const showEmptyState = problems.length === 0 && !hasActiveFilters;

  // Keyboard shortcuts: Enter = write, Shift+Enter = scan
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (formMode !== 'closed') return;

      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.getAttribute('contenteditable') === 'true' ||
        target?.closest('[role="dialog"]')
      )
        return;

      if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (e.shiftKey) {
          handleAddScan();
        } else {
          handleAddManually();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [formMode, handleAddManually, handleAddScan]);

  return (
    <>
      {/* Stats strip */}
      <StatsStrip problems={problems} />

      {/* Form slot */}
      {formMode !== 'closed' && (
        <div className="form-slot-enter rounded-lg border bg-card p-4 md:p-6">
          <ProblemForm
            key={editingProblem?.id ?? formMode}
            subjectId={subjectId}
            availableTags={availableTags}
            problem={editingProblem}
            alwaysExpanded
            initialShowImageScan={formMode === 'create-scan'}
            onCancel={handleCloseForm}
            onProblemCreated={handleProblemCreated}
            onProblemUpdated={handleProblemUpdated}
          />
        </div>
      )}

      {/* Empty state or table */}
      {showEmptyState ? (
        <EmptyState
          onAddManually={handleAddManually}
          onAddScan={handleAddScan}
        />
      ) : (
        <EnhancedProblemsTable
          initialProblems={problems}
          initialTagsByProblem={tagsByProblem}
          subjectId={subjectId}
          availableTags={availableTags}
          onProblemDeleted={handleProblemDeleted}
          onEditProblem={handleEditProblem}
          onFiltersActiveChange={handleFiltersActiveChange}
        />
      )}

      {/* FAB */}
      <ProblemFab
        hidden={formMode !== 'closed'}
        onAddManually={handleAddManually}
        onAddScan={handleAddScan}
      />

      {/* Switch from create to edit confirmation */}
      <ConfirmationDialog
        isOpen={switchDialog.open}
        title="Discard unsaved problem?"
        message="You have an unsaved problem. Switching to edit will discard it."
        confirmText="Discard & Edit"
        cancelText="Keep editing"
        onConfirm={handleConfirmSwitch}
        onCancel={() => setSwitchDialog({ open: false, pendingProblem: null })}
        variant="destructive"
      />
    </>
  );
}
