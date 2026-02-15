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
      const { data: subjects, error } = await supabaseClient
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: true });

      // RLS ensures we only see the signed-in user's rows.
      if (error) {
        // Fail soft so the page still renders
        return { data: [] as SubjectWithMetadata[] };
      }

      // Enrich with problem_count and last_activity
      const enriched = await Promise.all(
        (subjects || []).map(async (subject: any) => {
          // Count problems
          const { count } = await supabaseClient
            .from('problems')
            .select('*', { count: 'exact', head: true })
            .eq('subject_id', subject.id);

          // Get most recent last_reviewed_date
          const { data: lastReviewed } = await supabaseClient
            .from('problems')
            .select('last_reviewed_date')
            .eq('subject_id', subject.id)
            .order('last_reviewed_date', {
              ascending: false,
              nullsFirst: false,
            })
            .limit(1)
            .maybeSingle();

          return {
            ...subject,
            problem_count: count ?? 0,
            last_activity: lastReviewed?.last_reviewed_date ?? null,
          };
        })
      );

      return { data: enriched };
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
