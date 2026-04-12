import { requireUser } from '@/lib/supabase/requireUser';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import SRSummaryClient from './sr-summary-client';

export async function generateMetadata() {
  const t = await getTranslations('Metadata');
  return { title: t('reviewSummaryMetaTitle') };
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

  const { user } = await requireUser();
  if (!user) {
    redirect(
      `/auth/login?redirect=/subjects/${subjectId}/review-due/summary${sessionId ? `?sessionId=${sessionId}` : ''}`
    );
  }

  if (!sessionId) {
    notFound();
  }

  const supabase = await createClient();

  // Validate session belongs to user
  const { data: session } = await supabase
    .from('review_session_state')
    .select('id, subject_id, session_type')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .in('session_type', ['spaced_repetition', 'insights_review'])
    .single();

  if (!session || session.subject_id !== subjectId) {
    notFound();
  }

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
