import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/user-management';
import { ProfileSheet } from '@/components/profile-sheet';

export async function ProfileButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant="default">
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  const profile = await getUserProfile(user.sub);

  return <ProfileSheet initialProfile={profile} email={user.email ?? ''} />;
}
