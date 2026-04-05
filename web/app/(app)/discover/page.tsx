import { createServiceClient } from '@/lib/supabase-utils';
import { unstable_cache } from 'next/cache';
import { CACHE_DURATIONS, CACHE_TAGS } from '@/lib/cache-config';
import DiscoverPageClient from './discover-page-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Problem Sets – Wrong Question Notebook',
  description:
    'Browse and search student-created problem sets across subjects. Find study materials shared by other students.',
  openGraph: {
    title: 'Discover Problem Sets – Wrong Question Notebook',
    description:
      'Browse and search student-created problem sets across subjects.',
    url: 'https://wqn.magicworks.app/discover',
    siteName: 'Wrong Question Notebook',
  },
  alternates: {
    canonical: 'https://wqn.magicworks.app/discover',
  },
};

async function loadDiscoveryData() {
  const cachedLoad = unstable_cache(
    async () => {
      const serviceClient = createServiceClient();

      // Fetch initial page of listed public sets, ranked by score
      const { data: rawSets } = await serviceClient
        .from('problem_sets')
        .select(
          `
          id, user_id, name, description, is_smart, created_at,
          discovery_subject,
          problem_set_stats!inner (
            view_count, unique_view_count, like_count, copy_count,
            problem_count, ranking_score
          )
        `
        )
        .eq('sharing_level', 'public')
        .eq('is_listed', true)
        .gt('problem_set_stats.problem_count', 0)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch owner profiles separately (no direct FK from problem_sets to user_profiles)
      const ownerIds = [
        ...new Set((rawSets || []).map((s: any) => s.user_id).filter(Boolean)),
      ];
      const profileMap = new Map<string, any>();
      if (ownerIds.length > 0) {
        const { data: profiles } = await serviceClient
          .from('user_profiles')
          .select('id, username, first_name, last_name, avatar_url')
          .in('id', ownerIds);
        for (const p of profiles || []) {
          profileMap.set(p.id, p);
        }
      }

      const sets = (rawSets || []).map((set: any) => {
        const profile = profileMap.get(set.user_id);
        const displayName =
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
          profile?.username ||
          'Anonymous';

        return {
          id: set.id,
          name: set.name,
          description: set.description,
          subject_name: set.discovery_subject || 'Other',
          subject_color: null,
          subject_icon: null,
          problem_count: set.problem_set_stats?.problem_count || 0,
          is_smart: set.is_smart,
          owner: {
            username: profile?.username || null,
            display_name: displayName,
            avatar_url: profile?.avatar_url || null,
          },
          stats: {
            view_count: set.problem_set_stats?.view_count || 0,
            unique_view_count: set.problem_set_stats?.unique_view_count || 0,
            like_count: set.problem_set_stats?.like_count || 0,
            copy_count: set.problem_set_stats?.copy_count || 0,
            problem_count: set.problem_set_stats?.problem_count || 0,
            ranking_score: set.problem_set_stats?.ranking_score || 0,
          },
          created_at: set.created_at,
        };
      });

      // Sort by ranking score (descending) since DB can't order by embedded columns
      sets.sort(
        (a, b) => (b.stats.ranking_score || 0) - (a.stats.ranking_score || 0)
      );

      // Fetch distinct discovery subjects (exclude empty sets)
      const { data: subjectRows } = await serviceClient
        .from('problem_sets')
        .select('discovery_subject, problem_set_stats!inner(problem_count)')
        .eq('sharing_level', 'public')
        .eq('is_listed', true)
        .not('discovery_subject', 'is', null)
        .gt('problem_set_stats.problem_count', 0);

      const subjectCounts = new Map<string, number>();
      for (const row of (subjectRows || []) as any[]) {
        const name = row.discovery_subject;
        if (name) subjectCounts.set(name, (subjectCounts.get(name) || 0) + 1);
      }
      const subjects = Array.from(subjectCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      return { sets, subjects };
    },
    ['discovery-initial'],
    {
      tags: [CACHE_TAGS.DISCOVERY],
      revalidate: CACHE_DURATIONS.DISCOVERY,
    }
  );

  return cachedLoad();
}

export default async function DiscoverPage() {
  const { sets, subjects } = await loadDiscoveryData();

  return <DiscoverPageClient initialSets={sets} initialSubjects={subjects} />;
}
