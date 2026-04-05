import { createClient } from '@/lib/supabase/server';
import ProblemsPageClient from './problems-page-client';
import { ROUTES } from '@/lib/constants';
import { BackLink } from '@/components/back-link';
import { unstable_cache } from 'next/cache';
import {
  CACHE_DURATIONS,
  CACHE_TAGS,
  createSubjectCacheTag,
  createUserCacheTag,
} from '@/lib/cache-config';
import { Tag } from '@/lib/types';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { subject } = await loadData(id);
  const t = await getTranslations('Subjects');
  return {
    title: `${subject?.name} – ${t('title')}`,
  };
}

async function loadData(subjectId: string) {
  const supabase = await createClient();

  // Get user for cache key
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    return {
      subject: null,
      problems: [],
      tagsByProblem: {},
      availableTags: [],
    };
  }

  const cachedLoadData = unstable_cache(
    async (subjectId: string, userId: string, supabaseClient: any) => {
      // Subject detail
      const { data: subject } = await supabaseClient
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single();

      if (!subject)
        return {
          subject: null,
          problems: [],
          tagsByProblem: {},
          availableTags: [],
        };

      // Load problems and tags in parallel
      const [{ data: problems }, { data: availableTags }] = await Promise.all([
        supabaseClient
          .from('problems')
          .select('*')
          .eq('subject_id', subjectId)
          .order('created_at', { ascending: false }),
        supabaseClient
          .from('tags')
          .select('id, name')
          .eq('subject_id', subjectId)
          .order('name', { ascending: true }),
      ]);

      const p = problems ?? [];
      const ids = p.map((x: any) => x.id);
      const tagsByProblem: Record<string, Tag[]> = {};

      if (ids.length) {
        // Join problem_tag -> tags to collect tags per problem
        const { data: links } = await supabaseClient
          .from('problem_tag')
          .select('problem_id, tags:tag_id ( id, name )')
          .in('problem_id', ids);

        // Group by problem_id
        (links ?? []).forEach((row: any) => {
          if (!tagsByProblem[row.problem_id]) {
            tagsByProblem[row.problem_id] = [];
          }
          if (row.tags) {
            tagsByProblem[row.problem_id].push(row.tags);
          }
        });
      }

      return {
        subject,
        problems: p,
        tagsByProblem,
        availableTags: availableTags ?? [],
      };
    },
    [`subject-problems-${subjectId}-${userId}`],
    {
      tags: [
        CACHE_TAGS.PROBLEMS,
        CACHE_TAGS.TAGS,
        createSubjectCacheTag(CACHE_TAGS.PROBLEMS, subjectId),
        createSubjectCacheTag(CACHE_TAGS.TAGS, subjectId),
        createUserCacheTag(CACHE_TAGS.USER_PROBLEMS, userId),
      ],
      revalidate: CACHE_DURATIONS.PROBLEMS,
    }
  );

  const cachedData = await cachedLoadData(subjectId, userId, supabase);

  return {
    subject: cachedData.subject,
    problems: cachedData.problems,
    tagsByProblem: cachedData.tagsByProblem,
    availableTags: cachedData.availableTags,
  };
}

export default async function SubjectProblemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { subject, problems, tagsByProblem, availableTags } =
    await loadData(id);
  const t = await getTranslations('Subjects');
  const tCommon = await getTranslations('Common');

  if (!subject) {
    return (
      <div className="section-container">
        <p className="text-body-sm text-muted-foreground">{t('notFound')}</p>
        <BackLink href={ROUTES.SUBJECTS}>{t('backToShelf')}</BackLink>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div className="flex items-center justify-between">
        <div className="page-header">
          <h1 className="page-title">
            {subject.name} — {t('title')}
          </h1>
          <p className="page-description">{t('pageDescription')}</p>
        </div>
        <BackLink href={ROUTES.SUBJECTS}>
          <span className="hidden md:inline">{t('backToShelf')}</span>
          <span className="md:hidden">{tCommon('back')}</span>
        </BackLink>
      </div>

      {/* Problems page with create form and search */}
      <ProblemsPageClient
        initialProblems={problems}
        initialTagsByProblem={tagsByProblem}
        subjectId={subject.id}
        availableTags={availableTags}
      />
    </div>
  );
}
