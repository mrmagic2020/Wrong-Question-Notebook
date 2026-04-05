import type { Metadata } from 'next';
import SubjectsPageClient from './subjects-page-client';
import { createClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';
import {
  CACHE_DURATIONS,
  CACHE_TAGS,
  createUserCacheTag,
} from '@/lib/cache-config';
import { SubjectWithMetadata } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Your Notebook Shelf – Wrong Question Notebook',
  description: 'View and manage your subjects',
};

async function loadSubjects() {
  const supabase = await createClient();

  // Get user for cache key
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    return { data: [] as SubjectWithMetadata[] };
  }

  const cachedLoadSubjects = unstable_cache(
    async (userId: string, supabaseClient: any) => {
      // Use database function to fetch subjects with metadata in a single query
      const { data: subjects, error } = await supabaseClient.rpc(
        'get_subjects_with_metadata'
      );

      // RLS ensures we only see the signed-in user's rows via auth.uid() in the function
      if (error) {
        // Fail soft so the page still renders
        return { data: [] as SubjectWithMetadata[] };
      }

      return { data: subjects || [] };
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
