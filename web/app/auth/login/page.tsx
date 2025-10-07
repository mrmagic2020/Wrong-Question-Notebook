import { LoginForm } from '@/components/login-form';
import { AuthNav } from '@/components/auth-nav';
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AuthNav />
      <div className="flex flex-1 w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm redirectTo={params.redirect} />
        </div>
      </div>
    </main>
  );
}
