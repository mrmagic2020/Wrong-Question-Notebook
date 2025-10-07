import { UpdatePasswordForm } from '@/components/update-password-form';
import { AuthNav } from '@/components/auth-nav';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { ROUTES } from '@/lib/constants';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Update Password – Wrong Question Notebook',
};

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect(ROUTES.HOME);
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AuthNav />
      <div className="flex flex-1 w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <UpdatePasswordForm />
        </div>
      </div>
    </main>
  );
}
