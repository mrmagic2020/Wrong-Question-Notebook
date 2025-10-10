import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/supabase/requireUser';
import { getProblemSetWithFullData } from '@/lib/problem-set-utils';
import ProblemSetPageClient from './problem-set-page-client';
import { unstable_cache } from 'next/cache';
import {
  CACHE_DURATIONS,
  CACHE_TAGS,
  createProblemSetCacheTag,
  createUserCacheTag,
} from '@/lib/cache-config';

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

async function loadProblemSet(id: string) {
  const supabase = await createClient();
  const { user } = await requireUser();

  if (!user) {
    return null;
  }

  const cachedLoadProblemSet = unstable_cache(
    async (
      problemSetId: string,
      userId: string,
      userEmail: string,
      supabaseClient: any
    ) => {
      // Use the shared utility function to get complete problem set data
      return await getProblemSetWithFullData(
        supabaseClient,
        problemSetId,
        userId,
        userEmail
      );
    },
    [`problem-set-${id}-${user.id}`],
    {
      tags: [
        CACHE_TAGS.PROBLEM_SETS,
        createProblemSetCacheTag(CACHE_TAGS.PROBLEM_SETS, id),
        createUserCacheTag(CACHE_TAGS.USER_PROBLEM_SETS, user.id),
      ],
      revalidate: CACHE_DURATIONS.PROBLEM_SETS,
    }
  );

  return await cachedLoadProblemSet(id, user.id, user.email || '', supabase);
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

  return <ProblemSetPageClient initialProblemSet={problemSet} />;
}
