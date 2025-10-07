import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/requireUser';
import ProblemSetsPageClient from './problem-sets-page-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Problem Sets – Wrong Question Notebook',
};

async function loadProblemSets() {
  const supabase = await createClient();
  const { user } = await requireUser();

  if (!user) {
    return { data: [] as any[] };
  }

  // Get only problem sets owned by the current user
  const { data: problemSets, error: problemSetsError } = await supabase
    .from('problem_sets')
    .select(
      `
      *,
      problem_set_shares(
        id,
        shared_with_email
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (problemSetsError) {
    console.error('Error loading problem sets:', problemSetsError);
    return { data: [] as any[] };
  }

  // Get subject names and problem counts separately
  const problemSetsWithData = await Promise.all(
    (problemSets || []).map(async problemSet => {
      // Get subject name
      const { data: subject } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', problemSet.subject_id)
        .single();

      // Get problem count
      const { count: problemCount } = await supabase
        .from('problem_set_problems')
        .select('*', { count: 'exact', head: true })
        .eq('problem_set_id', problemSet.id);

      // Transform shared emails
      const shared_with_emails =
        problemSet.problem_set_shares?.map(
          (share: any) => share.shared_with_email
        ) || [];

      return {
        ...problemSet,
        problem_count: problemCount || 0,
        subject_name: subject?.name || 'Unknown',
        shared_with_emails,
      };
    })
  );

  return { data: problemSetsWithData };
}

export default async function ProblemSetsPage() {
  const { data } = await loadProblemSets();

  return <ProblemSetsPageClient initialProblemSets={data} />;
}
