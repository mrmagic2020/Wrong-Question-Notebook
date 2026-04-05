'use client';

import { Cookie } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useConsent } from './consent-provider';

export function ConsentBanner() {
  const t = useTranslations('CookieConsent');
  const { acceptAll, rejectAll, openPreferences } = useConsent();

  return (
    <div className="cookie-banner-slide-up fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6">
      <div className="bg-white dark:bg-stone-900 max-w-3xl mx-auto rounded-2xl border border-amber-200/40 dark:border-amber-800/30 shadow-lg p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="landing-icon-box bg-amber-500/10 dark:bg-amber-500/20 flex-shrink-0">
              <Cookie className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('weValuePrivacy')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('cookieDesc')}
                <Link
                  href="/privacy#section-6"
                  className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                >
                  {t('learnMore', { namespace: 'Common' })}
                </Link>
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={openPreferences}
              className="text-sm"
            >
              {t('managePreferences')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={rejectAll}
              className="text-sm"
            >
              {t('rejectAll')}
            </Button>
            <Button size="sm" onClick={acceptAll} className="text-sm shadow-md">
              {t('acceptAll')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
