import { requireUser } from '@/lib/supabase/requireUser';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import SubjectInsightsClient from './subject-insights-client';

export function generateMetadata() {
  return { title: 'Subject Insights – Wrong Question Notebook' };
}

export default async function SubjectInsightsPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;
  const { user } = await requireUser();
  if (!user) redirect(`/auth/login?redirect=/insights/${subjectId}`);

  const supabase = await createClient();

  // Fetch subject
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, color')
    .eq('id', subjectId)
    .eq('user_id', user.id)
    .single();

  if (!subject) notFound();

  // Fetch latest digest
  const { data: digest } = await supabase
    .from('insight_digests')
    .select('*')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch recent insights review sessions for this subject
  const { data: reviewSessions } = await supabase
    .from('review_session_state')
    .select('id, is_active, session_state')
    .eq('user_id', user.id)
    .eq('session_type', 'insights_review')
    .eq('subject_id', subjectId)
    .order('last_activity_at', { ascending: false })
    .limit(50);

  const sessionSummaries = (reviewSessions ?? []).map(s => ({
    id: s.id,
    is_active: s.is_active as boolean,
    problem_ids: (
      (s.session_state as { problem_ids?: string[] })?.problem_ids ?? []
    ).sort(),
  }));

  return (
    <SubjectInsightsClient
      subject={subject}
      digest={digest}
      reviewSessions={sessionSummaries}
    />
  );
}
