import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import ProblemReview from './problem-review';
import { CACHE_DURATIONS } from '@/lib/cache-config';
import { cacheUserData } from '@/lib/user-data-cache';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; problemId: string }>;
}) {
  const { id: subjectId, problemId } = await params;
  const { problem } = await loadData(subjectId, problemId);
  const t = await getTranslations('Metadata');
  return {
    title: t('reviewItemMetaTitle', { name: problem?.title ?? '' }),
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

  // Typed loosely, as before this loader was cached: the generated row types
  // don't line up with the app's hand-written Problem/Subject/stat types.
  const db: any = supabase;

  return await cacheUserData(
    async () => {
      // Get the problem with all details
      const { data: problem, error } = await db
        .from('problems')
        .select('*')
        .eq('id', problemId)
        .eq('subject_id', subjectId)
        .single();

      if (error || !problem) {
        return { problem: null, subject: null, allProblems: [] };
      }

      // Get the subject
      const { data: subject } = await db
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single();

      // Get all problems in this subject for navigation
      const { data: allProblems } = await db
        .from('problems')
        .select('id, title, problem_type, status')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });

      // Get tags for this problem
      const { data: tagLinks } = await db
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
    {
      userId,
      key: ['problem-review', subjectId, problemId],
      revalidate: CACHE_DURATIONS.PROBLEMS,
    }
  );
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
