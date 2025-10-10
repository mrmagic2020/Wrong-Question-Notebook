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
} from '@/lib/types';

export const metadata: Metadata = {
  title: 'All Problem Sets – Wrong Question Notebook',
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

          // Get problem count
          const { count: problemCount } = await supabaseClient
            .from('problem_set_problems')
            .select('*', { count: 'exact', head: true })
            .eq('problem_set_id', problemSet.id);

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
