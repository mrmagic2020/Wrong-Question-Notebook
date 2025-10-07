import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/supabase/requireUser';
import { getProblemSetWithFullData } from '@/lib/problem-set-utils';
import ProblemSetPageClient from './problem-set-page-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problemSet = await loadProblemSet(id);
  return {
    title: `${problemSet?.name} – Wrong Question Notebook`,
  };
}

async function loadProblemSet(id: string) {
  const supabase = await createClient();
  const { user } = await requireUser();

  if (!user) {
    return null;
  }

  // Use the shared utility function to get complete problem set data
  return await getProblemSetWithFullData(
    supabase,
    id,
    user.id,
    user.email || ''
  );
}

export default async function ProblemSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problemSet = await loadProblemSet(id);

  if (!problemSet) {
    notFound();
  }

  return <ProblemSetPageClient initialProblemSet={problemSet} />;
}
