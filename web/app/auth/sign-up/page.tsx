import { SignUpForm } from '@/components/sign-up-form';
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
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}
