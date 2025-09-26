// web/src/app/(app)/subjects/page.tsx
import SubjectForm from './subject-form';
import SubjectRow from './subject-row';
import { createClient } from '@/lib/supabase/server';

async function loadSubjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: true });

  // RLS ensures we only see the signed-in user's rows.
  // If unauthorised, middleware should redirect to /auth/login.
  if (error) {
    // Fail soft so the page still renders; you can also throw to show the Next error page.
    return { data: [] as any[] };
  }
  return { data: data ?? [] };
}

export default async function SubjectsPage() {
  const { data } = await loadSubjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Subjects</h1>
        <p className="text-gray-600">Create, rename, or delete subjects.</p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-medium">Add a subject</h2>
        <SubjectForm />
      </div>

      <div className="rounded-lg border bg-white p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2 w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length ? (
              data.map(s => <SubjectRow key={s.id} subject={s} />)
            ) : (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={2}>
                  No subjects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
