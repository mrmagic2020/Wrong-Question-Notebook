'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import SubjectForm from './subject-form';
import SubjectRow from './subject-row';
import { PageHeader } from '@/components/page-header';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Subject } from '@/lib/types';
import { Search } from 'lucide-react';

export default function SubjectsPageClient({
  initialSubjects,
}: {
  initialSubjects: Subject[];
}) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { showConfirmation, ConfirmationDialogComponent } =
    useConfirmationDialog();

  const filteredSubjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(s => s.name.toLowerCase().includes(q));
  }, [subjects, query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '/') return;

      // Ignore when typing in an input/textarea/contenteditable.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTypingTarget =
        tag === 'input' ||
        tag === 'textarea' ||
        target?.getAttribute('contenteditable') === 'true';
      if (isTypingTarget) return;

      e.preventDefault();
      searchInputRef.current?.focus();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSubjectDeleted = (subjectId: string) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
  };

  const handleSubjectCreated = (newSubject: Subject) => {
    setSubjects(prev => [...prev, newSubject]);
  };

  const handleSubjectUpdated = (updatedSubject: Subject) => {
    setSubjects(prev =>
      prev.map(s => (s.id === updatedSubject.id ? updatedSubject : s))
    );
  };

  return (
    <>
      <div className="section-container">
        <PageHeader
          title="Subjects"
          description="Create, rename, or delete subjects."
        />

        <Card className="card-section">
          <CardHeader className="card-section-header">
            <CardTitle className="card-section-title">Add a subject</CardTitle>
          </CardHeader>
          <CardContent className="card-section-content">
            <SubjectForm onSubjectCreated={handleSubjectCreated} />
          </CardContent>
        </Card>

        <Card className="card-section">
          <CardHeader className="card-section-header">
            <CardTitle className="card-section-title flex items-center justify-between gap-4">
              <span>Your subjects</span>
              <div className="flex w-full max-w-sm items-center gap-2">
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search subjects..."
                    className="pl-9"
                    aria-label="Search subjects"
                  />
                </div>
                {query.trim() ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setQuery('')}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="card-section-content">
            {subjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="rounded-full border border-border bg-muted p-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-body-md font-medium">No subjects yet</p>
                <p className="text-body-sm text-muted-foreground max-w-md">
                  Create your first subject above (e.g. “Calculus”, “Physics”,
                  “Algorithms”).
                </p>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="rounded-full border border-border bg-muted p-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-body-md font-medium">No matches</p>
                <p className="text-body-sm text-muted-foreground max-w-md">
                  No subjects match “{query.trim()}”. Try a different search.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuery('')}
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="w-full text-sm">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Name</th>
                        <th className="table-header-cell w-48">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubjects.map(s => (
                        <SubjectRow
                          key={s.id}
                          subject={s}
                          onSubjectDeleted={handleSubjectDeleted}
                          onSubjectUpdated={handleSubjectUpdated}
                          showConfirmation={showConfirmation}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Tip: press <span className="font-medium">/</span> to jump to
                  search.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      {ConfirmationDialogComponent}
    </>
  );
}
