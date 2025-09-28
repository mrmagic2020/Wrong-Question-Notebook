import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { AuthNav } from '@/components/auth-nav';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // If user is already logged in, redirect to subjects page
  if (data?.claims) {
    redirect('/subjects');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AuthNav />
      <div className="flex flex-1 w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
