import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/user-management';
import { ProfileSheet } from '@/components/profile-sheet';
import { AuthButtons } from '@/components/auth-buttons';

export async function ProfileButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    return <AuthButtons />;
  }

  const profile = await getUserProfile(user.sub);

  return <ProfileSheet initialProfile={profile} email={user.email ?? ''} />;
}
