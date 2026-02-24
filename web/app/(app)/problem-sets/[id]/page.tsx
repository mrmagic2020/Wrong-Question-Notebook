import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/supabase/requireUser';
import { getProblemSetWithFullData } from '@/lib/problem-set-utils';
import { createServiceClient } from '@/lib/supabase-utils';
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

  if (user) {
    // Authenticated user: use their Supabase client with caching
    const cachedLoadProblemSet = unstable_cache(
      async (
        problemSetId: string,
        userId: string,
        userEmail: string,
        supabaseClient: any
      ) => {
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

  // Anonymous user: use service client to bypass RLS, only public sets accessible
  const cachedLoadPublicProblemSet = unstable_cache(
    async (problemSetId: string) => {
      const serviceClient = createServiceClient();
      return await getProblemSetWithFullData(
        serviceClient,
        problemSetId,
        null,
        null
      );
    },
    [`problem-set-public-${id}`],
    {
      tags: [
        CACHE_TAGS.PROBLEM_SETS,
        createProblemSetCacheTag(CACHE_TAGS.PROBLEM_SETS, id),
      ],
      revalidate: CACHE_DURATIONS.PROBLEM_SETS,
    }
  );

  return await cachedLoadPublicProblemSet(id);
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

  const { user } = await requireUser();

  return (
    <ProblemSetPageClient
      initialProblemSet={problemSet}
      isAuthenticated={!!user}
    />
  );
}
