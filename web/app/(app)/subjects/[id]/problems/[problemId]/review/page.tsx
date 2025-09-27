import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProblemReview from './problem-review';

async function loadData(subjectId: string, problemId: string) {
  const supabase = await createClient();

  // Get the problem with all details
  const { data: problem, error } = await supabase
    .from('problems')
    .select('*')
    .eq('id', problemId)
    .eq('subject_id', subjectId)
    .single();

  if (error || !problem) {
    return { problem: null, subject: null, allProblems: [] };
  }

  // Get the subject
  const { data: subject } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .single();

  // Get all problems in this subject for navigation
  const { data: allProblems } = await supabase
    .from('problems')
    .select('id, title, problem_type, status')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });

  // Get tags for this problem
  const { data: tagLinks } = await supabase
    .from('problem_tag')
    .select('tags:tag_id ( id, name )')
    .eq('problem_id', problemId);

  const tags = tagLinks?.map((link: any) => link.tags).filter(Boolean) || [];

  return {
    problem: { ...problem, tags },
    subject,
    allProblems: allProblems || [],
  };
}

export default async function ProblemReviewPage({
  params,
}: {
  params: Promise<{ id: string; problemId: string }>;
}) {
  const { id: subjectId, problemId } = await params;
  const { problem, subject, allProblems } = await loadData(
    subjectId,
    problemId
  );

  if (!problem || !subject) {
    notFound();
  }

  return (
    <ProblemReview
      problem={problem}
      subject={subject}
      allProblems={allProblems}
    />
  );
}
