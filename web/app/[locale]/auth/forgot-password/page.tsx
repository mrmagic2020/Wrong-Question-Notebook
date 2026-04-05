import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ForgotPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

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
