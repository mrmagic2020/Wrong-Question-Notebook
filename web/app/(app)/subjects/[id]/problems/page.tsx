import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ProblemsPageClient from './problems-page-client';

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
      availableTags: [],
    };

  // Load problems and tags in parallel
  const [{ data: problems }, { data: availableTags }] = await Promise.all([
    supabase
      .from('problems')
      .select('*')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false }),
    supabase
      .from('tags')
      .select('id, name')
      .eq('subject_id', subjectId)
      .order('name', { ascending: true }),
  ]);

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

  return {
    subject,
    problems: p,
    tagsByProblem,
    availableTags: availableTags ?? [],
  };
}

export default async function SubjectProblemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { subject, problems, tagsByProblem, availableTags } =
    await loadData(id);

  if (!subject) {
    return (
      <div className="section-container">
        <p className="text-body-sm text-muted-foreground">Subject not found.</p>
        <Link
          href="/subjects"
          className="text-primary underline hover:text-primary/80 transition-colors"
        >
          Back to Subjects
        </Link>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div className="flex items-center justify-between">
        <div className="page-header">
          <h1 className="page-title">{subject.name} — Problems</h1>
          <p className="page-description">
            Problems are isolated to this subject.
          </p>
        </div>
        <Link
          href="/subjects"
          className="text-sm text-primary underline hover:text-primary/80 transition-colors"
        >
          ← Back to Subjects
        </Link>
      </div>

      {/* Problems page with create form and search */}
      <ProblemsPageClient
        initialProblems={problems}
        initialTagsByProblem={tagsByProblem}
        subjectId={subject.id}
        availableTags={availableTags}
      />
    </div>
  );
}
