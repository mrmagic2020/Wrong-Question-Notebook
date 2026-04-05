import type { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase-utils';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, CACHE_DURATIONS } from '@/lib/cache-config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const getCachedSitemap = unstable_cache(
    async () => {
      const supabase = createServiceClient();

      // Fetch all listed public problem sets
      const { data: publicSets } = await supabase
        .from('problem_sets')
        .select('id, user_id, updated_at')
        .eq('sharing_level', 'public')
        .eq('is_listed', true)
        .order('updated_at', { ascending: false })
        .limit(5000);

      const setUrls: MetadataRoute.Sitemap = (publicSets || []).map(set => ({
        url: `https://wqn.magicworks.app/problem-sets/${set.id}`,
        lastModified: new Date(set.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));

      // Fetch creator usernames for listed public sets
      // No direct FK from problem_sets to user_profiles, so collect user_ids then query profiles
      const ownerIds = [
        ...new Set(
          (publicSets || []).map((s: any) => s.user_id).filter(Boolean)
        ),
      ];
      const creatorUsernames = new Set<string>();
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('username')
          .in('id', ownerIds)
          .not('username', 'is', null);
        for (const p of profiles || []) {
          if (p.username) creatorUsernames.add(p.username);
        }
      }

      const creatorUrls: MetadataRoute.Sitemap = Array.from(
        creatorUsernames
      ).map(username => ({
        url: `https://wqn.magicworks.app/creators/${username}`,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }));

      return [
        {
          url: 'https://wqn.magicworks.app',
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 1.0,
        },
        {
          url: 'https://wqn.magicworks.app/discover',
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.9,
        },
        {
          url: 'https://wqn.magicworks.app/privacy',
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.3,
        },
        ...setUrls,
        ...creatorUrls,
      ];
    },
    ['sitemap'],
    { tags: [CACHE_TAGS.SITEMAP], revalidate: CACHE_DURATIONS.SITEMAP }
  );

  return getCachedSitemap();
}
