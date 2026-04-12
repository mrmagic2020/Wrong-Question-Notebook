import { createServiceClient } from '@/lib/supabase-utils';
import { unstable_cache } from 'next/cache';
import { CACHE_DURATIONS, CACHE_TAGS } from '@/lib/cache-config';
import { PROBLEM_SET_CONSTANTS } from '@/lib/constants';
import { getTranslations } from 'next-intl/server';
import DiscoverPageClient from './discover-page-client';

export async function generateMetadata() {
  const t = await getTranslations('Discover');
  const tMeta = await getTranslations('Metadata');
  const siteName = tMeta('siteName');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: `${t('metaTitle')} – ${siteName}`,
      description: t('metaDescription'),
      url: 'https://wqn.magicworks.app/discover',
      siteName,
    },
    alternates: {
      canonical: 'https://wqn.magicworks.app/discover',
    },
  };
}

async function loadDiscoveryData() {
  const cachedLoad = unstable_cache(
    async () => {
      const serviceClient = createServiceClient();

      // Query the flattened view — ranking_score is a direct column, so
      // DB-level ordering works natively (no JS sort needed)
      const { data: rawSets } = await serviceClient
        .from('discoverable_problem_sets')
        .select('*')
        .order('ranking_score', { ascending: false })
        .order('id', { ascending: false })
        .limit(PROBLEM_SET_CONSTANTS.DISCOVERY_PAGE_SIZE);

      // Fetch owner profiles separately (no direct FK to user_profiles)
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
          problem_count: set.problem_count || 0,
          is_smart: set.is_smart,
          owner: {
            username: profile?.username || null,
            display_name: displayName,
            avatar_url: profile?.avatar_url || null,
          },
          stats: {
            view_count: set.view_count || 0,
            unique_view_count: set.unique_view_count || 0,
            like_count: set.like_count || 0,
            copy_count: set.copy_count || 0,
            problem_count: set.problem_count || 0,
            ranking_score: set.ranking_score || 0,
          },
          created_at: set.created_at,
        };
      });

      // Fetch discovery subject counts via DB-side aggregation (GROUP BY)
      const { data: subjectRows } = await serviceClient.rpc(
        'get_discovery_subject_counts'
      );

      const subjects = (
        (subjectRows || []) as { name: string; count: number }[]
      ).map(row => ({ name: row.name, count: Number(row.count) }));

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
