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

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problemSet = await loadProblemSet(id);

  if (!problemSet) {
    return { title: 'Problem Set Not Found – Wrong Question Notebook' };
  }

  const description = problemSet.description
    ? stripHtml(problemSet.description).substring(0, 160)
    : `${problemSet.problem_count} problems in ${problemSet.subject_name}`;

  return {
    title: `${problemSet.name} – Wrong Question Notebook`,
    description,
    openGraph: {
      title: problemSet.name,
      description,
      type: 'article' as const,
      url: `https://wqn.magicworks.app/problem-sets/${id}`,
      siteName: 'Wrong Question Notebook',
    },
    twitter: {
      card: 'summary' as const,
      title: problemSet.name,
      description,
    },
    alternates: {
      canonical: `https://wqn.magicworks.app/problem-sets/${id}`,
    },
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

async function loadSocialData(id: string, userId: string | null) {
  const serviceClient = createServiceClient();

  // Fetch stats
  const { data: stats, error: statsError } = await serviceClient
    .from('problem_set_stats')
    .select(
      'view_count, unique_view_count, like_count, copy_count, problem_count, ranking_score'
    )
    .eq('problem_set_id', id)
    .maybeSingle();

  if (statsError) {
    console.error('[loadSocialData] Stats query error:', statsError.message);
  }

  let socialState = null;
  if (userId) {
    const [likeResult, favResult] = await Promise.all([
      serviceClient
        .from('problem_set_likes')
        .select('user_id')
        .eq('user_id', userId)
        .eq('problem_set_id', id)
        .maybeSingle(),
      serviceClient
        .from('problem_set_favourites')
        .select('user_id')
        .eq('user_id', userId)
        .eq('problem_set_id', id)
        .maybeSingle(),
    ]);
    socialState = {
      liked: !!likeResult.data,
      favourited: !!favResult.data,
    };
  }

  return { stats, socialState };
}

export default async function ProblemSetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const problemSet = await loadProblemSet(id);

  if (!problemSet) {
    notFound();
  }

  const { user } = await requireUser();

  // Fetch social data for non-private sets
  const isShared = problemSet.sharing_level !== 'private';
  const { stats, socialState } = isShared
    ? await loadSocialData(id, user?.id ?? null)
    : { stats: null, socialState: null };

  // Check if the current user has a username (for ListedToggle)
  let hasUsername = true;
  if (user) {
    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    hasUsername = !!profile?.username;
  }

  return (
    <ProblemSetPageClient
      initialProblemSet={problemSet}
      isAuthenticated={!!user}
      ownerProfile={problemSet.ownerProfile ?? null}
      initialStats={stats}
      initialSocialState={socialState}
      hasUsername={hasUsername}
      backHref={from || '/problem-sets'}
    />
  );
}
