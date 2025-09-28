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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {initialSubject.name} — Tags
            </h1>
            <p className="text-muted-foreground">
              Tags are scoped to this subject.
            </p>
          </div>
          <Link
            href={`/subjects/${initialSubject.id}/problems`}
            className="text-sm text-primary underline hover:text-primary/80 transition-colors"
          >
            ← Back to Problems
          </Link>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-medium text-card-foreground">Add a tag</h2>
          <TagForm
            subjectId={initialSubject.id}
            onTagCreated={handleTagCreated}
          />
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
                  <td className="px-4 py-6 text-muted-foreground" colSpan={2}>
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
