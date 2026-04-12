'use client';

import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function AuthButtons() {
  const t = useTranslations('Navigation');
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
        <Link href={`/auth/login${redirect}`}>{t('signIn')}</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href={`/auth/sign-up${redirect}`}>{t('signUp')}</Link>
      </Button>
    </div>
  );
}
