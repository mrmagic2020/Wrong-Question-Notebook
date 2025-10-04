import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AddProblemsToSetClient from './add-problems-to-set-client';

async function loadProblemSet(id: string) {
  const supabase = await createClient();

  const { data: problemSet, error: problemSetError } = await supabase
    .from('problem_sets')
    .select('*')
    .eq('id', id)
    .single();

  if (problemSetError || !problemSet) {
    return null;
  }

  const { data: subject } = await supabase
    .from('subjects')
    .select('name')
    .eq('id', problemSet.subject_id)
    .single();

  return {
    ...problemSet,
    subject_name: subject?.name || 'Unknown',
  };
}

async function loadData(subjectId: string) {
  const supabase = await createClient();

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
    problems: p,
    tagsByProblem,
    availableTags: availableTags ?? [],
  };
}

async function loadProblemSetProblems(problemSetId: string) {
  const supabase = await createClient();

  const { data: problemSetProblems } = await supabase
    .from('problem_set_problems')
    .select('problem_id')
    .eq('problem_set_id', problemSetId);

  return problemSetProblems?.map(p => p.problem_id) || [];
}

export default async function AddProblemsToSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const problemSet = await loadProblemSet(id);
  if (!problemSet) {
    notFound();
  }

  const [{ problems, tagsByProblem, availableTags }, problemSetProblemIds] =
    await Promise.all([
      loadData(problemSet.subject_id),
      loadProblemSetProblems(id),
    ]);

  return (
    <AddProblemsToSetClient
      problemSet={problemSet}
      problems={problems}
      tagsByProblem={tagsByProblem}
      availableTags={availableTags}
      problemSetProblemIds={problemSetProblemIds}
    />
  );
}
