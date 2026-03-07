import { requireUser } from '@/lib/supabase/requireUser';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import SRSummaryClient from './sr-summary-client';

export function generateMetadata() {
  return {
    title: 'Review Summary – Wrong Question Notebook',
  };
}

export default async function SRSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { id: subjectId } = await params;
  const { sessionId } = await searchParams;

  if (!sessionId) {
    notFound();
  }

  const { user } = await requireUser();
  if (!user) {
    notFound();
  }

  const supabase = await createClient();

  // Get subject name
  const { data: subject } = await supabase
    .from('subjects')
    .select('name')
    .eq('id', subjectId)
    .single();

  if (!subject) {
    notFound();
  }

  return (
    <SRSummaryClient
      subjectId={subjectId}
      subjectName={subject.name}
      sessionId={sessionId}
    />
  );
}
