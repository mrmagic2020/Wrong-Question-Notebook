import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/supabase/requireUser';
import ProblemSetPageClient from './problem-set-page-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problemSet = await loadProblemSet(id);
  return {
    title: `${problemSet?.name} – Wrong Question Notebook`,
  };
}

// Helper function to check limited access
async function checkLimitedAccess(
  supabase: any,
  problemSetId: string,
  userEmail: string
): Promise<boolean> {
  try {
    const { data: share, error } = await supabase
      .from('problem_set_shares')
      .select('id')
      .eq('problem_set_id', problemSetId)
      .eq('shared_with_email', userEmail)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking limited access:', error);
      return false;
    }

    return !!share;
  } catch (error) {
    console.error('Error checking limited access:', error);
    return false;
  }
}

async function loadProblemSet(id: string) {
  const supabase = await createClient();
  const { user } = await requireUser();

  if (!user) {
    return null;
  }

  // Get the basic problem set data
  const { data: problemSet, error: problemSetError } = await supabase
    .from('problem_sets')
    .select('*')
    .eq('id', id)
    .single();

  if (problemSetError) {
    console.error('Error loading problem set:', problemSetError);
    return null;
  }

  // Check access permissions
  const isOwner = problemSet.user_id === user.id;
  const isPublic = problemSet.sharing_level === 'public';
  const isLimited = problemSet.sharing_level === 'limited';
  const hasLimitedAccess =
    isLimited && (await checkLimitedAccess(supabase, id, user.email || ''));

  const hasAccess = isOwner || isPublic || hasLimitedAccess;

  if (!hasAccess) {
    return null;
  }

  // Get the subject name separately
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('name')
    .eq('id', problemSet.subject_id)
    .single();

  if (subjectError) {
    console.error('Error loading subject:', subjectError);
  }

  // Get the problems in this set
  const { data: problemSetProblems, error: problemsError } = await supabase
    .from('problem_set_problems')
    .select(
      `
      problem_id,
      added_at,
      problems(
        id,
        title,
        content,
        problem_type,
        status,
        last_reviewed_date,
        created_at
      )
    `
    )
    .eq('problem_set_id', id);

  if (problemsError) {
    console.error('Error loading problem set problems:', problemsError);
  }

  // Transform the data to include problems
  const problems =
    problemSetProblems
      ?.map((psp: any) => {
        const problem = psp.problems;
        if (!problem) {
          console.warn(
            'Problem not found for problem_set_problem:',
            psp.problem_id
          );
          return null;
        }
        return {
          ...problem,
          tags: [], // Temporarily empty to avoid complex queries
          added_at: psp.added_at,
        };
      })
      .filter(Boolean) || [];

  return {
    ...problemSet,
    subject_name: subject?.name || 'Unknown',
    problems,
    problem_count: problems.length,
    isOwner,
  };
}

async function loadProblemSetProgress(id: string) {
  const supabase = await createClient();
  const { user } = await requireUser();

  if (!user) {
    return {
      total_problems: 0,
      wrong_count: 0,
      needs_review_count: 0,
      mastered_count: 0,
    };
  }

  // Check if user has access to this problem set
  const { data: problemSet } = await supabase
    .from('problem_sets')
    .select('id, user_id, sharing_level')
    .eq('id', id)
    .single();

  if (!problemSet) {
    return {
      total_problems: 0,
      wrong_count: 0,
      needs_review_count: 0,
      mastered_count: 0,
    };
  }

  // Check access permissions
  const hasAccess =
    problemSet.user_id === user.id ||
    problemSet.sharing_level === 'public' ||
    (problemSet.sharing_level === 'limited' &&
      (await checkLimitedAccess(supabase, id, user.email || '')));

  if (!hasAccess) {
    return {
      total_problems: 0,
      wrong_count: 0,
      needs_review_count: 0,
      mastered_count: 0,
    };
  }

  // Get progress by querying the problems directly
  const { data: problemSetProblems, error: progressError } = await supabase
    .from('problem_set_problems')
    .select(
      `
      problems(
        status
      )
    `
    )
    .eq('problem_set_id', id);

  if (progressError) {
    console.error('Error loading progress data:', progressError);
    return {
      total_problems: 0,
      wrong_count: 0,
      needs_review_count: 0,
      mastered_count: 0,
    };
  }

  const problems =
    problemSetProblems?.map(p => p.problems).filter(Boolean) || [];

  const progress = {
    total_problems: problems.length,
    wrong_count: problems.filter((p: any) => p.status === 'wrong').length,
    needs_review_count: problems.filter((p: any) => p.status === 'needs_review')
      .length,
    mastered_count: problems.filter((p: any) => p.status === 'mastered').length,
  };

  return progress;
}

export default async function ProblemSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problemSet = await loadProblemSet(id);

  if (!problemSet) {
    notFound();
  }

  const progress = await loadProblemSetProgress(id);

  return (
    <ProblemSetPageClient
      initialProblemSet={problemSet}
      initialProgress={progress}
    />
  );
}
