'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
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
      aria-label="Log out"
      title="Log out"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
