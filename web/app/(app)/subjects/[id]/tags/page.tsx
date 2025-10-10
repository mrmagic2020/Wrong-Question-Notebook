import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import TagsPageClient from './tags-page-client';
import { unstable_cache } from 'next/cache';
import {
  CACHE_DURATIONS,
  CACHE_TAGS,
  createSubjectCacheTag,
  createUserCacheTag,
} from '@/lib/cache-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { subject } = await load(id);
  return {
    title: `${subject?.name} Tags – Wrong Question Notebook`,
  };
}

async function load(subjectId: string) {
  const supabase = await createClient();

  // Get user for cache key
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    return { subject: null, tags: [] };
  }

  const cachedLoad = unstable_cache(
    async (subjectId: string, userId: string, supabaseClient: any) => {
      const [{ data: subject }, { data: tags }] = await Promise.all([
        supabaseClient
          .from('subjects')
          .select('*')
          .eq('id', subjectId)
          .single(),
        supabaseClient
          .from('tags')
          .select('*')
          .eq('subject_id', subjectId)
          .order('name', { ascending: true }),
      ]);
      return { subject, tags: tags ?? [] };
    },
    [`subject-tags-${subjectId}-${userId}`],
    {
      tags: [
        CACHE_TAGS.TAGS,
        createSubjectCacheTag(CACHE_TAGS.TAGS, subjectId),
        createUserCacheTag(CACHE_TAGS.USER_TAGS, userId),
      ],
      revalidate: CACHE_DURATIONS.TAGS,
    }
  );

  return await cachedLoad(subjectId, userId, supabase);
}

export default async function SubjectTagsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { subject, tags } = await load(id);

  if (!subject) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Subject not found.</p>
        <Link
          href="/subjects"
          className="text-primary underline hover:text-primary/80 transition-colors"
        >
          Back to Subjects
        </Link>
      </div>
    );
  }

  return <TagsPageClient initialSubject={subject} initialTags={tags} />;
}
