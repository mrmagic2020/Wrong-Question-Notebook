import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/requireUser';
import { notFound } from 'next/navigation';
import SummaryClient from './summary-client';

export function generateMetadata() {
  return {
    title: 'Review Summary – Wrong Question Notebook',
  };
}

export default async function SummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { id } = await params;
  const { sessionId } = await searchParams;

  if (!sessionId) {
    notFound();
  }

  const supabase = await createClient();
  const { user } = await requireUser();

  if (!user) {
    notFound();
  }

  // Get problem set name
  const { data: problemSet } = await supabase
    .from('problem_sets')
    .select('name, subject_id, subjects(name)')
    .eq('id', id)
    .single();

  if (!problemSet) {
    notFound();
  }

  return (
    <SummaryClient
      problemSetId={id}
      sessionId={sessionId}
      problemSetName={problemSet.name}
      subjectName={(problemSet as any).subjects?.name || 'Unknown'}
    />
  );
}
