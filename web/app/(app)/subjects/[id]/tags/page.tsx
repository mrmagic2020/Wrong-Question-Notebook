import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import TagsPageClient from './tags-page-client';
import { unstable_cache } from 'next/cache';
import {
  CACHE_DURATIONS,
  CACHE_TAGS,
  createSubjectCacheTag,
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

  const cachedLoad = unstable_cache(
    async () => {
      const [{ data: subject }, { data: tags }] = await Promise.all([
        supabase.from('subjects').select('*').eq('id', subjectId).single(),
        supabase
          .from('tags')
          .select('*')
          .eq('subject_id', subjectId)
          .order('name', { ascending: true }),
      ]);
      return { subject, tags: tags ?? [] };
    },
    [`subject-tags-${subjectId}`],
    {
      tags: [
        CACHE_TAGS.TAGS,
        createSubjectCacheTag(CACHE_TAGS.TAGS, subjectId),
      ],
      revalidate: CACHE_DURATIONS.TAGS,
    }
  );

  return await cachedLoad();
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
