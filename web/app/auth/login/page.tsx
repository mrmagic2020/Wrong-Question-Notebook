import { LoginForm } from '@/components/login-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login – Wrong Question Notebook',
};

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // Await searchParams before using its properties
  const params = await searchParams;

  // If user is already logged in, redirect to intended destination or subjects page
  if (data?.claims) {
    const destination = params.redirect || ROUTES.SUBJECTS;
    redirect(destination);
  }

  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <LoginForm redirectTo={params.redirect} />
      </div>
    </div>
  );
}
