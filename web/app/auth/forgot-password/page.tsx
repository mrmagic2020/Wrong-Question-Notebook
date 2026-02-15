import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Password Reset – Wrong Question Notebook',
};

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // If user is already logged in, redirect to subjects page
  if (data?.claims) {
    redirect('/subjects');
  }

  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
