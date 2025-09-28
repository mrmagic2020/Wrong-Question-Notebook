'use client';

import { useState } from 'react';
import SubjectForm from './subject-form';
import SubjectRow from './subject-row';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface Subject {
  id: string;
  name: string;
  created_at: string;
}

export default function SubjectsPageClient({
  initialSubjects,
}: {
  initialSubjects: Subject[];
}) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const { showConfirmation, ConfirmationDialogComponent } =
    useConfirmationDialog();

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Subjects</h1>
          <p className="text-muted-foreground">
            Create, rename, or delete subjects.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-medium text-card-foreground">
            Add a subject
          </h2>
          <SubjectForm onSubjectCreated={handleSubjectCreated} />
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2 text-muted-foreground">Name</th>
                <th className="px-4 py-2 w-48 text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.length ? (
                subjects.map(s => (
                  <SubjectRow
                    key={s.id}
                    subject={s}
                    onSubjectDeleted={handleSubjectDeleted}
                    onSubjectUpdated={handleSubjectUpdated}
                    showConfirmation={showConfirmation}
                  />
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={2}>
                    No subjects yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {ConfirmationDialogComponent}
    </>
  );
}
