import type { Metadata } from 'next';
import SubjectsPageClient from './subjects-page-client';
import { createClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';
import {
  CACHE_DURATIONS,
  CACHE_TAGS,
  createUserCacheTag,
} from '@/lib/cache-config';

export const metadata: Metadata = {
  title: 'All Subjects – Wrong Question Notebook',
};

async function loadSubjects() {
  const supabase = await createClient();

  // Get user for cache key
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    return { data: [] as any[] };
  }

  const cachedLoadSubjects = unstable_cache(
    async (userId: string, supabaseClient: any) => {
      const { data, error } = await supabaseClient
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: true });

      // RLS ensures we only see the signed-in user's rows.
      if (error) {
        // Fail soft so the page still renders; you can also throw to show the Next error page.
        return { data: [] as any[] };
      }
      return { data: data ?? [] };
    },
    [`subjects-${userId}`],
    {
      tags: [
        CACHE_TAGS.SUBJECTS,
        createUserCacheTag(CACHE_TAGS.USER_SUBJECTS, userId),
      ],
      revalidate: CACHE_DURATIONS.SUBJECTS,
    }
  );

  return await cachedLoadSubjects(userId, supabase);
}

export default async function SubjectsPage() {
  const { data } = await loadSubjects();

  return <SubjectsPageClient initialSubjects={data} />;
}
