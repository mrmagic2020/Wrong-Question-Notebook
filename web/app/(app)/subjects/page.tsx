import SubjectsPageClient from './subjects-page-client';
import { createClient } from '@/lib/supabase/server';

async function loadSubjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: true });

  // RLS ensures we only see the signed-in user's rows.
  // If unauthorised, middleware should redirect to /auth/login.
  if (error) {
    // Fail soft so the page still renders; you can also throw to show the Next error page.
    return { data: [] as any[] };
  }
  return { data: data ?? [] };
}

export default async function SubjectsPage() {
  const { data } = await loadSubjects();

  return <SubjectsPageClient initialSubjects={data} />;
}
