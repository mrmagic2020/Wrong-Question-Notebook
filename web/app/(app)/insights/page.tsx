import { requireUser } from '@/lib/supabase/requireUser';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { INSIGHT_CONSTANTS } from '@/lib/constants';
import InsightsPageClient from './insights-page-client';

export function generateMetadata() {
  return { title: 'Insights – Wrong Question Notebook' };
}

export default async function InsightsPage() {
  const { user } = await requireUser();
  if (!user) redirect('/auth/login?redirect=/insights');

  const supabase = await createClient();

  // Fetch latest digest (any status)
  const { data: latestRow } = await supabase
    .from('insight_digests')
    .select('*')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Determine if generation is in progress
  let isGenerating = false;
  let digest = latestRow;

  if (latestRow?.status === 'generating') {
    const staleThreshold = new Date(
      Date.now() - INSIGHT_CONSTANTS.GENERATING_STALE_MINUTES * 60 * 1000
    );
    const generatedAt = new Date(latestRow.generated_at);

    if (generatedAt < staleThreshold) {
      // Stale — treat as no digest
      digest = null;
    } else {
      isGenerating = true;
      digest = null;
    }
  } else if (latestRow?.status === 'failed') {
    // Failed — treat as no digest
    digest = null;
  }

  // Fetch subjects for color mapping
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, color')
    .eq('user_id', user.id);

  return (
    <InsightsPageClient
      initialDigest={digest}
      initialIsGenerating={isGenerating}
      subjects={subjects || []}
    />
  );
}
