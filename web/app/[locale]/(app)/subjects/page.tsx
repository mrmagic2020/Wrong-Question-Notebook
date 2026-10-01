import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import SubjectsPageClient from './subjects-page-client';
import { createClient } from '@/lib/supabase/server';
import { CACHE_DURATIONS } from '@/lib/cache-config';
import { cacheUserData } from '@/lib/user-data-cache';
import { SubjectWithMetadata } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('shelfMetaTitle') };
}

async function loadSubjects() {
  const supabase = await createClient();

  // Get user for cache key
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    return { data: [] as SubjectWithMetadata[] };
  }

  return await cacheUserData(
    async () => {
      // Use database function to fetch subjects with metadata in a single query
      const { data: subjects, error } = await supabase.rpc(
        'get_subjects_with_metadata'
      );

      // RLS ensures we only see the signed-in user's rows via auth.uid() in the function
      if (error) {
        // Fail soft so the page still renders
        return { data: [] as SubjectWithMetadata[] };
      }

      return { data: (subjects || []) as SubjectWithMetadata[] };
    },
    { userId, key: ['subjects'], revalidate: CACHE_DURATIONS.SUBJECTS }
  );
}

export default async function SubjectsPage() {
  const { data } = await loadSubjects();

  return <SubjectsPageClient initialSubjects={data} />;
}
