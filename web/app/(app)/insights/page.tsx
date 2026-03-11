import { requireUser } from '@/lib/supabase/requireUser';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import InsightsPageClient from './insights-page-client';

export function generateMetadata() {
  return { title: 'Insights – Wrong Question Notebook' };
}

export default async function InsightsPage() {
  const { user } = await requireUser();
  if (!user) redirect('/auth/login?redirect=/insights');

  const supabase = await createClient();

  // Fetch latest digest
  const { data: digest } = await supabase
    .from('insight_digests')
    .select('*')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch subjects for color mapping
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, color')
    .eq('user_id', user.id);

  return (
    <InsightsPageClient initialDigest={digest} subjects={subjects || []} />
  );
}
