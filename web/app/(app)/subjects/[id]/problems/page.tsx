import { createClient } from '@/lib/supabase/server';
import ProblemRow from './problem-row';
import ProblemForm from './problem-form';
import Link from 'next/link';

async function loadData(subjectId: string) {
  const supabase = await createClient();

  // Subject detail
  const { data: subject } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .single();

  if (!subject)
    return {
      subject: null,
      problems: [],
      tagsByProblem: new Map<string, any[]>(),
    };

  // Problems for this subject
  const { data: problems } = await supabase
    .from('problems')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });

  const p = problems ?? [];
  const ids = p.map((x: any) => x.id);
  const tagsByProblem = new Map<string, any[]>();

  if (ids.length) {
    // Join problem_tag -> tags to collect tags per problem
    const { data: links } = await supabase
      .from('problem_tag')
      .select('problem_id, tags:tag_id ( id, name )')
      .in('problem_id', ids);

    // Group by problem_id
    (links ?? []).forEach((row: any) => {
      const arr = tagsByProblem.get(row.problem_id) ?? [];
      if (row.tags) arr.push(row.tags);
      tagsByProblem.set(row.problem_id, arr);
    });
  }

  return { subject, problems: p, tagsByProblem };
}

export default async function SubjectProblemsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const { subject, problems, tagsByProblem } = await loadData(id);

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
          <h1 className="text-2xl font-semibold">{subject.name} — Problems</h1>
          <p className="text-gray-600">
            Problems are isolated to this subject.
          </p>
        </div>
        <Link href="/subjects" className="text-sm text-blue-600 underline">
          ← Back to Subjects
        </Link>
      </div>

      {/* Create form with subject fixed */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-medium">Add a problem</h2>
        {/* Pass subjectId; form will hide the subject selector */}
        <ProblemForm subjectId={subject.id} />
      </div>

      {/* Problems table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Tags</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.length ? (
              problems.map((p: any) => (
                <ProblemRow
                  key={p.id}
                  problem={p}
                  tags={tagsByProblem.get(p.id) ?? []}
                />
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  No problems yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
