import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/requireUser';
import { notFound, redirect } from 'next/navigation';
import ProblemReview from '@/app/(app)/subjects/[id]/problems/[problemId]/review/problem-review';
import SessionReviewClient from './session-review-client';
import { BackLink } from '@/components/back-link';
import { getFilteredProblems } from '@/lib/review-utils';
import { createServiceClient } from '@/lib/supabase-utils';
import { FilterConfig } from '@/lib/types';

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

  // Use service client if no authenticated user (for loading public sets metadata)
  const queryClient = user ? supabase : createServiceClient();

  const { data: problemSet, error: problemSetError } = await queryClient
    .from('problem_sets')
    .select('*')
    .eq('id', id)
    .single();

  if (problemSetError || !problemSet) {
    return null;
  }

  const { data: subject } = await queryClient
    .from('subjects')
    .select('name')
    .eq('id', problemSet.subject_id)
    .single();

  const isOwner = !!user && problemSet.user_id === user.id;

  return {
    ...problemSet,
    subject_name: subject?.name || 'Unknown',
    isOwner,
  };
}

async function loadProblemSetProblems(problemSet: any, userId: string | null) {
  const supabase = await createClient();
  const isOwner = !!userId && problemSet.user_id === userId;
  const ownerUserId = problemSet.user_id;

  // Smart sets: fetch problems via filter criteria
  if (problemSet.is_smart && problemSet.filter_config) {
    const filterConfig: FilterConfig = {
      tag_ids: problemSet.filter_config.tag_ids ?? [],
      statuses: problemSet.filter_config.statuses ?? [],
      problem_types: problemSet.filter_config.problem_types ?? [],
      days_since_review: problemSet.filter_config.days_since_review ?? null,
      include_never_reviewed:
        problemSet.filter_config.include_never_reviewed ?? true,
    };
    // For non-owner access (shared or anonymous), use service client to bypass RLS
    const queryClient = isOwner ? supabase : createServiceClient();
    return getFilteredProblems(
      queryClient,
      ownerUserId,
      problemSet.subject_id,
      filterConfig,
      ownerUserId
    );
  }

  // Manual sets: fetch via junction table
  // Use service client for non-owner access to bypass RLS
  const queryClient = isOwner ? supabase : createServiceClient();
  const { data: problemSetProblems } = await queryClient
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
        answer_config,
        assets,
        solution_text,
        solution_assets
      )
    `
    )
    .eq('problem_set_id', problemSet.id);

  if (!problemSetProblems) {
    return [];
  }

  // Get tags for all problems
  const problemIds = problemSetProblems.map(p => p.problem_id);
  const { data: tagLinks } = await queryClient
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
  searchParams: Promise<{ problemId?: string; sessionId?: string }>;
}) {
  const { id } = await params;
  const { problemId, sessionId } = await searchParams;
  const { user } = await requireUser();

  // Session-based review requires authentication (sessions are tied to user_id)
  if (sessionId) {
    if (!user) {
      redirect(`/auth/login?redirect=/problem-sets/${id}/review`);
    }

    const problemSet = await loadProblemSet(id);
    if (!problemSet) {
      notFound();
    }

    return (
      <SessionReviewClient
        problemSetId={id}
        sessionId={sessionId}
        subjectId={problemSet.subject_id}
        subjectName={problemSet.subject_name}
        isReadOnly={!problemSet.isOwner}
        allowCopying={!problemSet.isOwner && problemSet.allow_copying}
      />
    );
  }

  // Legacy review mode: allow anonymous access for public problem sets
  const problemSet = await loadProblemSet(id);
  if (!problemSet) {
    // If no user and problem set not found (could be private), redirect to login
    if (!user) {
      redirect(`/auth/login?redirect=/problem-sets/${id}/review`);
    }
    notFound();
  }

  // If anonymous user and problem set is not public, redirect to login
  if (!user && problemSet.sharing_level !== 'public') {
    redirect(`/auth/login?redirect=/problem-sets/${id}/review`);
  }

  const problems = await loadProblemSetProblems(problemSet, user?.id ?? null);

  if (problems.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Problems in Set</h1>
          <p className="text-muted-foreground mb-4">
            This problem set doesn&apos;t have any problems yet.
          </p>
          <BackLink href={`/problem-sets/${id}`}>Back to Problem Set</BackLink>
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
      key={currentProblem.id}
      problem={currentProblem}
      subject={{ id: problemSet.subject_id, name: problemSet.subject_name }}
      allProblems={problems}
      prevProblem={prevProblem}
      nextProblem={nextProblem}
      isProblemSetMode={true}
      problemSetId={id}
      isReadOnly={!problemSet.isOwner}
      allowCopying={!problemSet.isOwner && problemSet.allow_copying}
      copyProblemSetId={id}
      isAuthenticated={!!user}
    />
  );
}
