import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProblemReview from './problem-review';
import { unstable_cache } from 'next/cache';
import {
  CACHE_DURATIONS,
  CACHE_TAGS,
  createSubjectCacheTag,
  createProblemCacheTag,
  createUserCacheTag,
} from '@/lib/cache-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; problemId: string }>;
}) {
  const { id: subjectId, problemId } = await params;
  const { problem } = await loadData(subjectId, problemId);
  return {
    title: `Review ${problem?.title} – Wrong Question Notebook`,
  };
}

async function loadData(subjectId: string, problemId: string) {
  const supabase = await createClient();

  // Get user for cache key
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    return { problem: null, subject: null, allProblems: [] };
  }

  const cachedLoadData = unstable_cache(
    async (
      subjectId: string,
      problemId: string,
      userId: string,
      supabaseClient: any
    ) => {
      // Get the problem with all details
      const { data: problem, error } = await supabaseClient
        .from('problems')
        .select('*')
        .eq('id', problemId)
        .eq('subject_id', subjectId)
        .single();

      if (error || !problem) {
        return { problem: null, subject: null, allProblems: [] };
      }

      // Get the subject
      const { data: subject } = await supabaseClient
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single();

      // Get all problems in this subject for navigation
      const { data: allProblems } = await supabaseClient
        .from('problems')
        .select('id, title, problem_type, status')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });

      // Get tags for this problem
      const { data: tagLinks } = await supabaseClient
        .from('problem_tag')
        .select('tags:tag_id ( id, name )')
        .eq('problem_id', problemId);

      const tags =
        tagLinks?.map((link: any) => link.tags).filter(Boolean) || [];

      return {
        problem: { ...problem, tags },
        subject,
        allProblems: allProblems || [],
      };
    },
    [`problem-review-${subjectId}-${problemId}-${userId}`],
    {
      tags: [
        CACHE_TAGS.PROBLEMS,
        createSubjectCacheTag(CACHE_TAGS.PROBLEMS, subjectId),
        createProblemCacheTag(CACHE_TAGS.PROBLEMS, problemId),
        createUserCacheTag(CACHE_TAGS.USER_PROBLEMS, userId),
      ],
      revalidate: CACHE_DURATIONS.PROBLEMS,
    }
  );

  return await cachedLoadData(subjectId, problemId, userId, supabase);
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
