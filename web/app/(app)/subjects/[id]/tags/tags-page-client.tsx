'use client';

import { useState } from 'react';
import Link from 'next/link';
import TagForm from './tag-form';
import TagRow from './tag-row';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface Tag {
  id: string;
  name: string;
  subject_id: string;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function TagsPageClient({
  initialSubject,
  initialTags,
}: {
  initialSubject: Subject;
  initialTags: Tag[];
}) {
  const [tags, setTags] = useState(initialTags);
  const { showConfirmation, ConfirmationDialogComponent } =
    useConfirmationDialog();

  const handleTagDeleted = (tagId: string) => {
    setTags(prev => prev.filter(t => t.id !== tagId));
  };

  const handleTagCreated = (newTag: Tag) => {
    setTags(prev => [...prev, newTag]);
  };

  const handleTagUpdated = (updatedTag: Tag) => {
    setTags(prev => prev.map(t => (t.id === updatedTag.id ? updatedTag : t)));
  };

  return (
    <>
      <div className="section-container">
        <div className="flex items-center justify-between">
          <div className="page-header">
            <h1 className="page-title">{initialSubject.name} — Tags</h1>
            <p className="page-description">Tags are scoped to this subject.</p>
          </div>
          <Link
            href={`/subjects/${initialSubject.id}/problems`}
            className="text-sm text-primary underline hover:text-primary/80 transition-colors"
          >
            ← Back to Problems
          </Link>
        </div>

        <div className="card-section">
          <div className="card-section-header">
            <h2 className="card-section-title">Add a tag</h2>
          </div>
          <TagForm
            subjectId={initialSubject.id}
            onTagCreated={handleTagCreated}
          />
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
              {tags.length ? (
                tags.map((t: any) => (
                  <TagRow
                    key={t.id}
                    tag={t}
                    onTagDeleted={handleTagDeleted}
                    onTagUpdated={handleTagUpdated}
                    showConfirmation={showConfirmation}
                  />
                ))
              ) : (
                <tr>
                  <td className="table-empty" colSpan={2}>
                    No tags yet.
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
