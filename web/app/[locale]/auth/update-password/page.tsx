import { UpdatePasswordForm } from '@/components/update-password-form';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants';
import { redirect } from 'next/navigation';

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect(ROUTES.HOME);
  }

  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
