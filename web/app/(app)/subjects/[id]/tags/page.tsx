import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import TagForm from './tag-form';
import TagRow from './tag-row';

async function load(subjectId: string) {
  const supabase = await createClient();
  const [{ data: subject }, { data: tags }] = await Promise.all([
    supabase.from('subjects').select('*').eq('id', subjectId).single(),
    supabase
      .from('tags')
      .select('*')
      .eq('subject_id', subjectId)
      .order('name', { ascending: true }),
  ]);
  return { subject, tags: tags ?? [] };
}

export default async function SubjectTagsPage({
  params,
}: {
  params: { id: string };
}) {
  const { subject, tags } = await load(params.id);

  if (!subject) {
    return (
      <div className="space-y-4">
        <p className="text-gray-600">Subject not found.</p>
        <Link href="/subjects" className="text-blue-600 underline">
          Back to Subjects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{subject.name} — Tags</h1>
          <p className="text-gray-600">Tags are scoped to this subject.</p>
        </div>
        <Link
          href={`/subjects/${subject.id}/problems`}
          className="text-sm text-blue-600 underline"
        >
          ← Back to Problems
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-medium">Add a tag</h2>
        <TagForm subjectId={subject.id} />
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2 w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tags.length ? (
              tags.map((t: any) => <TagRow key={t.id} tag={t} />)
            ) : (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={2}>
                  No tags yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
