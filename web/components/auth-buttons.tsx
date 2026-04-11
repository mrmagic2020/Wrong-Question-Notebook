'use client';

import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export function AuthButtons() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthPage = pathname.startsWith('/auth');
  const search = searchParams.toString();
  const fullPath = search ? `${pathname}?${search}` : pathname;
  const redirect =
    !isAuthPage && pathname !== '/'
      ? `?redirect=${encodeURIComponent(fullPath)}`
      : '';

  return (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={`/auth/login${redirect}`}>Sign in</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href={`/auth/sign-up${redirect}`}>Sign up</Link>
      </Button>
    </div>
  );
}
