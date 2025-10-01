// web/src/app/(app)/tags/page.tsx
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

function TagCapsules({ tags }: { tags: { id: string; name: string }[] }) {
  const maxShown = 7; // show up to 8 tags per subject here
  const shown = tags.slice(0, maxShown);
  const extra = tags.length - shown.length;

  return (
    <div className="flex flex-wrap gap-2">
      {shown.map(t => (
        <span
          key={t.id}
          className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          title={t.name}
        >
          {t.name.length > 22 ? t.name.slice(0, 22) + '…' : t.name}
        </span>
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          +{extra} more
        </span>
      )}
    </div>
  );
}

async function loadAllTagsGrouped() {
  const supabase = await createClient();

  // Fetch all subjects for the signed-in user (RLS ensures scoping)
  const { data: subjects = [] } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: true });

  // Fetch all tags; we’ll group them by subject_id in memory
  const { data: tags = [] } = await supabase
    .from('tags')
    .select('id, name, subject_id')
    .order('name', { ascending: true });

  const bySubject = new Map<string, { id: string; name: string }[]>();
  for (const t of tags ?? []) {
    const arr = bySubject.get(t.subject_id) ?? [];
    arr.push({ id: t.id, name: t.name });
    bySubject.set(t.subject_id, arr);
  }

  return { subjects, bySubject };
}

export default async function GlobalTagsPage() {
  const { subjects, bySubject } = await loadAllTagsGrouped();

  return (
    <div className="section-container">
      <div className="page-header">
        <h1 className="page-title">Tags by Subject</h1>
        <p className="page-description">
          View all tags grouped by subject. Use the links to manage or add tags
          for a specific subject.
        </p>
      </div>

      {subjects?.length === 0 ? (
        <div className="card-section">
          <p className="text-body-sm text-muted-foreground">
            No subjects yet. Create one on the{' '}
            <Link
              href="/subjects"
              className="underline text-primary hover:text-primary/80 transition-colors"
            >
              Subjects
            </Link>{' '}
            page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects?.map((s: any) => {
            const tags = bySubject.get(s.id) ?? [];
            return (
              <div key={s.id} className="card-section">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="heading-xs text-card-foreground">
                      {s.name}{' '}
                      <span className="text-body-sm text-muted-foreground">
                        ({tags.length} tag
                        {tags.length === 1 ? '' : 's'})
                      </span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/subjects/${s.id}/tags`}>Manage tags</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/subjects/${s.id}/problems`}>
                        View problems
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-3">
                  {tags.length ? (
                    <TagCapsules tags={tags} />
                  ) : (
                    <p className="text-body-sm text-muted-foreground">
                      No tags yet. Click{' '}
                      <span className="font-medium">Manage tags</span> to add
                      some.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
