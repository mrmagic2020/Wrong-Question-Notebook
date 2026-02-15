'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotebookCard } from '@/components/subjects/notebook-card';
import { PlaceholderNotebookCard } from '@/components/subjects/placeholder-notebook-card';
import { SubjectEditDialog } from '@/components/subjects/subject-edit-dialog';
import { SubjectCreateDialog } from '@/components/subjects/subject-create-dialog';
import { PageHeader } from '@/components/page-header';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SubjectWithMetadata } from '@/lib/types';
import { Search, BookMarked } from 'lucide-react';
import { toast } from 'sonner';

export default function SubjectsPageClient({
  initialSubjects,
}: {
  initialSubjects: SubjectWithMetadata[];
}) {
  const router = useRouter();
  const [subjects, setSubjects] = useState(initialSubjects);
  const [query, setQuery] = useState('');
  const [editingSubject, setEditingSubject] =
    useState<SubjectWithMetadata | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { showConfirmation, ConfirmationDialogComponent } =
    useConfirmationDialog();

  // Sort by last activity (most recent first), fallback to created_at
  const sortedSubjects = useMemo(() => {
    return [...subjects].sort((a, b) => {
      const aDate = a.last_activity || a.created_at || '';
      const bDate = b.last_activity || b.created_at || '';
      return bDate.localeCompare(aDate);
    });
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedSubjects;
    return sortedSubjects.filter(s => s.name.toLowerCase().includes(q));
  }, [sortedSubjects, query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        target?.getAttribute('contenteditable') === 'true'
      )
        return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSubjectClick = (subjectId: string) => {
    router.push(`/subjects/${subjectId}/problems`);
  };

  const handleSubjectDeleted = (subject: SubjectWithMetadata) => {
    showConfirmation({
      title: 'Remove Notebook from Shelf',
      message: `Remove the "${subject.name}" notebook? Everything inside (${subject.problem_count ?? 0} ${(subject.problem_count ?? 0) === 1 ? 'problem' : 'problems'}, tags, and problem sets) will be permanently deleted. This cannot be undone.`,
      confirmText: 'Remove Notebook',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/subjects/${subject.id}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Failed to delete');
          setSubjects(prev => prev.filter(s => s.id !== subject.id));
          toast.success('Notebook removed from shelf');
          router.refresh();
        } catch {
          toast.error('Failed to remove notebook');
        }
      },
    });
  };

  const handleSubjectCreated = (newSubject: SubjectWithMetadata) => {
    setSubjects(prev => [...prev, newSubject]);
    router.refresh();
  };

  return (
    <>
      <div className="section-container">
        <PageHeader
          title="Your Notebook Shelf"
          description="Organize your learning by subject. Each notebook holds the problems you're working on."
          actions={
            subjects.length > 0 ? (
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search subjects..."
                  className="pl-10"
                />
              </div>
            ) : null
          }
        />

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-2xl border border-amber-200/40 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-900/20 p-6">
              <BookMarked className="mx-auto h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Your shelf is empty</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Click the placeholder card below to create your first subject.
                Try "Mathematics", "Physics", or "Computer Science".
              </p>
            </div>
            <div className="w-full max-w-sm mt-4 text-left">
              <PlaceholderNotebookCard
                onClick={() => setCreateDialogOpen(true)}
              />
            </div>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-full border bg-muted p-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No matches</h3>
              <p className="text-sm text-muted-foreground">
                No subjects match "{query.trim()}".
              </p>
            </div>
            <Button variant="outline" onClick={() => setQuery('')}>
              Clear search
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject, index) => (
                <NotebookCard
                  key={subject.id}
                  subject={subject}
                  onClick={() => handleSubjectClick(subject.id)}
                  onEdit={() => setEditingSubject(subject)}
                  onDelete={() => handleSubjectDeleted(subject)}
                  className="notebook-card-enter"
                  style={{ animationDelay: `${index * 0.08}s` }}
                />
              ))}
              {!query.trim() && (
                <PlaceholderNotebookCard
                  onClick={() => setCreateDialogOpen(true)}
                  className="notebook-card-enter"
                  style={{
                    animationDelay: `${filteredSubjects.length * 0.08}s`,
                  }}
                />
              )}
            </div>
            <p className="mt-6 text-xs text-muted-foreground text-center">
              Tip: press <span className="font-medium">/</span> to search.
            </p>
          </>
        )}
      </div>

      {editingSubject && (
        <SubjectEditDialog
          open={!!editingSubject}
          onOpenChange={open => !open && setEditingSubject(null)}
          subject={editingSubject}
          onSuccess={updated => {
            setSubjects(prev =>
              prev.map(s =>
                s.id === updated.id
                  ? {
                      ...s,
                      ...updated,
                      problem_count: s.problem_count,
                      last_activity: s.last_activity,
                    }
                  : s
              )
            );
            router.refresh();
          }}
        />
      )}

      <SubjectCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        existingSubjects={subjects}
        onSuccess={handleSubjectCreated}
      />

      {ConfirmationDialogComponent}
    </>
  );
}
