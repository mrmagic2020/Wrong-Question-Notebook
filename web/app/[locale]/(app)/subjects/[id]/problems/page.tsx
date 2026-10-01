import { createClient } from '@/lib/supabase/server';
import ProblemsPageClient from './problems-page-client';
import { ROUTES } from '@/lib/constants';
import { BackLink } from '@/components/back-link';
import { CACHE_DURATIONS } from '@/lib/cache-config';
import { cacheUserData } from '@/lib/user-data-cache';
import { SimpleTag } from '@/lib/types';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { subject } = await loadData(id);
  const tMeta = await getTranslations('Metadata');
  return {
    title: tMeta('subjectProblemsMetaTitle', { subject: subject?.name ?? '' }),
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

  // Typed loosely, as before this loader was cached: the generated row types
  // don't line up with the app's hand-written Problem/Subject/stat types.
  const db: any = supabase;

  return await cacheUserData(
    async () => {
      // Subject detail
      const { data: subject } = await db
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
        db
          .from('problems')
          .select('*')
          .eq('subject_id', subjectId)
          .order('created_at', { ascending: false }),
        db
          .from('tags')
          .select('id, name')
          .eq('subject_id', subjectId)
          .order('name', { ascending: true }),
      ]);

      const p = problems ?? [];
      const ids = p.map((x: any) => x.id);
      const tagsByProblem: Record<string, SimpleTag[]> = {};

      if (ids.length) {
        // Join problem_tag -> tags to collect tags per problem
        const { data: links } = await db
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
    {
      userId,
      key: ['subject-problems', subjectId],
      revalidate: CACHE_DURATIONS.PROBLEMS,
    }
  );
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
            {subject.name} — {t('problems')}
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
