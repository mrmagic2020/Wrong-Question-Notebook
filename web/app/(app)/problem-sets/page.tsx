import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/requireUser';
import { createServiceClient } from '@/lib/supabase-utils';
import ProblemSetsPageClient from './problem-sets-page-client';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import {
  CACHE_DURATIONS,
  CACHE_TAGS,
  createUserCacheTag,
} from '@/lib/cache-config';
import {
  ProblemSet,
  ProblemSetWithDetails,
  ProblemSetShare,
  FilterConfig,
} from '@/lib/types';
import { getFilteredProblemsCount } from '@/lib/review-utils';

/** Shape returned by the joined Supabase select on problem_sets. */
type ProblemSetRow = ProblemSet & {
  subjects: { name: string } | null;
  problem_set_problems: { count: number }[];
  problem_set_shares: ProblemSetShare[];
};

export const metadata: Metadata = {
  title: 'All Problem Sets – Wrong Question Notebook',
  description:
    'View and manage your problem sets. Problem sets enable you to group problems together to review or to share with others.',
};

async function loadProblemSets() {
  const supabase = await createClient();
  const { user } = await requireUser();

  if (!user) {
    return { data: [] as ProblemSetWithDetails[], statsMap: {}, hasUsername: false };
  }

  const cachedLoadProblemSets = unstable_cache(
    async (userId: string, supabaseClient: any) => {
      // Fetch problem sets with subject name and manual-set count in one query
      const { data: problemSets, error: problemSetsError } =
        await supabaseClient
          .from('problem_sets')
          .select(
            `
            *,
            subjects(name),
            problem_set_problems(count),
            problem_set_shares(id, shared_with_email)
          `
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

      if (problemSetsError) {
        console.error('Error loading problem sets:', problemSetsError);
        return { data: [] as ProblemSetWithDetails[], statsMap: {}, hasUsername: false };
      }

      const rows: ProblemSetRow[] = problemSets || [];

      // Batch-fetch counts for smart sets in parallel
      const smartSets = rows.filter(ps => ps.is_smart && ps.filter_config);
      const smartCounts = await Promise.all(
        smartSets.map(ps => {
          const filterConfig: FilterConfig = {
            tag_ids: ps.filter_config?.tag_ids ?? [],
            statuses: ps.filter_config?.statuses ?? [],
            problem_types: ps.filter_config?.problem_types ?? [],
            days_since_review: ps.filter_config?.days_since_review ?? null,
            include_never_reviewed:
              ps.filter_config?.include_never_reviewed ?? true,
          };
          return getFilteredProblemsCount(
            supabaseClient,
            userId,
            ps.subject_id,
            filterConfig
          );
        })
      );
      const smartCountMap = new Map(
        smartSets.map((ps, i) => [ps.id, smartCounts[i]])
      );

      const problemSetsWithData: ProblemSetWithDetails[] = rows.map(ps => {
        const shared_with_emails =
          ps.problem_set_shares?.map(share => share.shared_with_email) || [];

        return {
          ...ps,
          problem_count: ps.is_smart
            ? smartCountMap.get(ps.id) || 0
            : ps.problem_set_problems?.[0]?.count || 0,
          subject_name: ps.subjects?.name || 'Unknown',
          shared_with_emails,
        };
      });

      // Fetch social stats for non-private sets (service client, same cache)
      const nonPrivateIds = problemSetsWithData
        .filter(ps => ps.sharing_level !== 'private')
        .map(ps => ps.id);
      const statsMap: Record<
        string,
        { view_count: number; like_count: number; copy_count: number }
      > = {};
      if (nonPrivateIds.length > 0) {
        const serviceClient = createServiceClient();
        const { data: statsRows } = await serviceClient
          .from('problem_set_stats')
          .select('problem_set_id, view_count, like_count, copy_count')
          .in('problem_set_id', nonPrivateIds);
        for (const row of statsRows || []) {
          statsMap[row.problem_set_id] = {
            view_count: row.view_count,
            like_count: row.like_count,
            copy_count: row.copy_count,
          };
        }
      }

      // Check if user has a username (for ListedToggle)
      const serviceClient = createServiceClient();
      const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('username')
        .eq('id', userId)
        .single();
      const hasUsername = !!profile?.username;

      return { data: problemSetsWithData, statsMap, hasUsername };
    },
    [`problem-sets-${user.id}`],
    {
      tags: [
        CACHE_TAGS.PROBLEM_SETS,
        createUserCacheTag(CACHE_TAGS.USER_PROBLEM_SETS, user.id),
      ],
      revalidate: CACHE_DURATIONS.PROBLEM_SETS,
    }
  );

  return await cachedLoadProblemSets(user.id, supabase);
}

export default async function ProblemSetsPage() {
  const { data, statsMap, hasUsername } = await loadProblemSets();

  return (
    <ProblemSetsPageClient
      initialProblemSets={data}
      statsMap={statsMap}
      hasUsername={hasUsername}
    />
  );
}
