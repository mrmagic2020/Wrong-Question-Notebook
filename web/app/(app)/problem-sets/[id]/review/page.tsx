import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/requireUser';
import { notFound } from 'next/navigation';
import ProblemReview from '@/app/(app)/subjects/[id]/problems/[problemId]/review/problem-review';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problemSet = await loadProblemSet(id);
  return {
    title: `Review ${problemSet?.name} – Wrong Question Notebook`,
  };
}

async function loadProblemSet(id: string) {
  const supabase = await createClient();
  const { user } = await requireUser();

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

  const isOwner = user && problemSet.user_id === user.id;

  return {
    ...problemSet,
    subject_name: subject?.name || 'Unknown',
    isOwner,
  };
}

async function loadProblemSetProblems(problemSetId: string) {
  const supabase = await createClient();

  const { data: problemSetProblems } = await supabase
    .from('problem_set_problems')
    .select(
      `
      problem_id,
      problems(
        id,
        title,
        content,
        problem_type,
        status,
        last_reviewed_date,
        created_at,
        subject_id,
        correct_answer,
        auto_mark,
        assets,
        solution_text,
        solution_assets
      )
    `
    )
    .eq('problem_set_id', problemSetId);

  if (!problemSetProblems) {
    return [];
  }

  // Get tags for all problems
  const problemIds = problemSetProblems.map(p => p.problem_id);
  const { data: tagLinks } = await supabase
    .from('problem_tag')
    .select('problem_id, tags:tag_id ( id, name )')
    .in('problem_id', problemIds);

  const tagsByProblem: Record<string, any[]> = {};
  (tagLinks || []).forEach((link: any) => {
    if (!tagsByProblem[link.problem_id]) {
      tagsByProblem[link.problem_id] = [];
    }
    if (link.tags) {
      tagsByProblem[link.problem_id].push(link.tags);
    }
  });

  // Transform the data
  const problems = problemSetProblems.map((psp: any) => {
    const problem = psp.problems;
    return {
      ...problem,
      tags: tagsByProblem[problem.id] || [],
      assets: problem.assets || [],
      solution_assets: problem.solution_assets || [],
    };
  });

  return problems;
}

export default async function ProblemSetReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ problemId?: string }>;
}) {
  const { id } = await params;
  const { problemId } = await searchParams;

  const problemSet = await loadProblemSet(id);
  if (!problemSet) {
    notFound();
  }

  const problems = await loadProblemSetProblems(id);

  if (problems.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Problems in Set</h1>
          <p className="text-muted-foreground mb-4">
            This problem set doesn't have any problems yet.
          </p>
          <a
            href={`/problem-sets/${id}`}
            className="text-primary underline hover:text-primary/80"
          >
            Back to Problem Set
          </a>
        </div>
      </div>
    );
  }

  // If no specific problem is requested, redirect to the first problem
  if (!problemId) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Starting Review</h1>
          <p className="text-muted-foreground mb-4">
            Redirecting to the first problem in the set...
          </p>
          <script>
            {`window.location.href = '/problem-sets/${id}/review?problemId=${problems[0].id}';`}
          </script>
        </div>
      </div>
    );
  }

  // Find the current problem
  const currentProblem = problems.find(p => p.id === problemId);
  if (!currentProblem) {
    notFound();
  }

  // Find the current problem index
  const currentIndex = problems.findIndex(p => p.id === problemId);
  const prevProblem = currentIndex > 0 ? problems[currentIndex - 1] : null;
  const nextProblem =
    currentIndex < problems.length - 1 ? problems[currentIndex + 1] : null;

  return (
    <ProblemReview
      problem={currentProblem}
      subject={{ id: problemSet.subject_id, name: problemSet.subject_name }}
      allProblems={problems}
      prevProblem={prevProblem}
      nextProblem={nextProblem}
      isProblemSetMode={true}
      problemSetId={id}
      isReadOnly={!problemSet.isOwner}
    />
  );
}
