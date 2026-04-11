import { LoginForm } from '@/components/login-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const { redirect: redirectParam } = await searchParams;

  if (data?.claims) {
    const destination = redirectParam || ROUTES.SUBJECTS;
    redirect(destination);
  }

  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <LoginForm redirectTo={redirectParam} />
      </div>
    </div>
  );
}
