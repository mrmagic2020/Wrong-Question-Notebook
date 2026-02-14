import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/requireUser';
import ProblemSetsPageClient from './problem-sets-page-client';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import {
  CACHE_DURATIONS,
  CACHE_TAGS,
  createUserCacheTag,
} from '@/lib/cache-config';
import {
  ProblemSetWithDetails,
  ProblemSet,
  ProblemSetShare,
  FilterConfig,
} from '@/lib/types';
import { getFilteredProblemsCount } from '@/lib/review-utils';

export const metadata: Metadata = {
  title: 'All Problem Sets – Wrong Question Notebook',
  description:
    'View and manage your problem sets. Problem sets enable you to group problems together to review or to share with others.',
};

async function loadProblemSets() {
  const supabase = await createClient();
  const { user } = await requireUser();

  if (!user) {
    return { data: [] as ProblemSetWithDetails[] };
  }

  const cachedLoadProblemSets = unstable_cache(
    async (userId: string, supabaseClient: any) => {
      // Get only problem sets owned by the current user
      const { data: problemSets, error: problemSetsError } =
        await supabaseClient
          .from('problem_sets')
          .select(
            `
          *,
          problem_set_shares(
            id,
            shared_with_email
          )
        `
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

      if (problemSetsError) {
        console.error('Error loading problem sets:', problemSetsError);
        return { data: [] as ProblemSetWithDetails[] };
      }

      // Get subject names and problem counts separately
      const problemSetsWithData = await Promise.all(
        (problemSets || []).map(async (problemSet: ProblemSet) => {
          // Get subject name
          const { data: subject } = await supabaseClient
            .from('subjects')
            .select('name')
            .eq('id', problemSet.subject_id)
            .single();

          // Get problem count (smart sets use filter criteria, not junction table)
          let problemCount: number | null = 0;
          if (problemSet.is_smart && problemSet.filter_config) {
            const filterConfig: FilterConfig = {
              tag_ids: problemSet.filter_config.tag_ids ?? [],
              statuses: problemSet.filter_config.statuses ?? [],
              problem_types: problemSet.filter_config.problem_types ?? [],
              days_since_review:
                problemSet.filter_config.days_since_review ?? null,
              include_never_reviewed:
                problemSet.filter_config.include_never_reviewed ?? true,
            };
            problemCount = await getFilteredProblemsCount(
              supabaseClient,
              userId,
              problemSet.subject_id,
              filterConfig
            );
          } else {
            const { count } = await supabaseClient
              .from('problem_set_problems')
              .select('*', { count: 'exact', head: true })
              .eq('problem_set_id', problemSet.id);
            problemCount = count;
          }

          // Transform shared emails
          const shared_with_emails =
            problemSet.problem_set_shares?.map(
              (share: ProblemSetShare) => share.shared_with_email
            ) || [];

          return {
            ...problemSet,
            problem_count: problemCount || 0,
            subject_name: subject?.name || 'Unknown',
            shared_with_emails,
          } as ProblemSetWithDetails;
        })
      );

      return { data: problemSetsWithData };
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
  const { data } = await loadProblemSets();

  return <ProblemSetsPageClient initialProblemSets={data} />;
}
