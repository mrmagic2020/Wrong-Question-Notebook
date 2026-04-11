'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function LogoutButton() {
  const t = useTranslations('Profile');
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();

    // Ensure server components re-render with the signed-out auth state.
    router.replace('/');
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-11 w-11"
      onClick={logout}
      aria-label={t('signOut')}
      title={t('signOut')}
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
