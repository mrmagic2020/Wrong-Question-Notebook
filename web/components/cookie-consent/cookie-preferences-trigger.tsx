'use client';

import { useTranslations } from 'next-intl';
import { useConsent } from './consent-provider';

export function CookiePreferencesTrigger() {
  const t = useTranslations('CookieConsent');
  const { openPreferences } = useConsent();

  return (
    <button
      type="button"
      onClick={openPreferences}
      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      {t('cookiePreferences')}
    </button>
  );
}
