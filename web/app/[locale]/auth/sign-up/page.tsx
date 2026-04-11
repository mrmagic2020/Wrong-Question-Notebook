import { SignUpForm } from '@/components/sign-up-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SignUpPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect('/subjects');
  }

  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <SignUpForm />
      </div>
    </div>
  );
}
