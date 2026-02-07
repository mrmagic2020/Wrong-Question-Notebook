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
    router.push('/');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={logout}
      aria-label="Log out"
      title="Log out"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
