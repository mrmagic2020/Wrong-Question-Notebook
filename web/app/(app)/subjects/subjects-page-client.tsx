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
      <div className="section-container">
        <div className="page-header">
          <h1 className="page-title">Subjects</h1>
          <p className="page-description">
            Create, rename, or delete subjects.
          </p>
        </div>

        <div className="card-section">
          <div className="card-section-header">
            <h2 className="card-section-title">Add a subject</h2>
          </div>
          <SubjectForm onSubjectCreated={handleSubjectCreated} />
        </div>

        <div className="table-container">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell w-48">Actions</th>
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
                  <td className="table-empty" colSpan={2}>
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
