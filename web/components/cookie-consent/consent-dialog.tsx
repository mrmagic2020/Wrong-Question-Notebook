'use client';

import { useState, useEffect } from 'react';
import { Cookie, BarChart3, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useConsent } from './consent-provider';
import { COOKIE_CONSENT_CONSTANTS } from '@/lib/constants';

interface ConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsentDialog({ open, onOpenChange }: ConsentDialogProps) {
  const t = useTranslations('CookieConsent');
  const tCommon = useTranslations('Common');
  const { consent, savePreferences } = useConsent();
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    if (open) {
      setAnalytics(consent?.analytics ?? false);
    }
  }, [open, consent]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            {t('cookiePreferences')}
          </DialogTitle>
          <DialogDescription>{t('cookiePreferencesDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Essential cookies */}
          <div className="rounded-xl border border-amber-200/40 dark:border-amber-800/30 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('essential')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('essentialDesc')}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-amber-100/80 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                {t('alwaysOn')}
              </span>
            </div>
            <ul className="mt-2.5 space-y-1 text-xs text-gray-500 dark:text-gray-400 pl-11">
              <li>
                <code className="text-[11px] bg-amber-200/30 dark:bg-amber-800/20 rounded px-1">
                  sb-*-auth-token
                </code>{' '}
                &mdash; Supabase authentication
              </li>
              <li>
                <code className="text-[11px] bg-amber-200/30 dark:bg-amber-800/20 rounded px-1">
                  {COOKIE_CONSENT_CONSTANTS.COOKIE_NAME}
                </code>{' '}
                &mdash; {t('yourPreferences')}
              </li>
            </ul>
          </div>

          {/* Analytics cookies */}
          <div className="rounded-xl border border-blue-200/40 dark:border-blue-800/30 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('analytics')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('analyticsDesc')}
                  </p>
                </div>
              </div>
              <Switch
                checked={analytics}
                onCheckedChange={setAnalytics}
                aria-label="Toggle analytics cookies"
              />
            </div>
            <ul className="mt-2.5 space-y-1 text-xs text-gray-500 dark:text-gray-400 pl-11">
              <li>
                <code className="text-[11px] bg-blue-200/30 dark:bg-blue-800/20 rounded px-1">
                  _vercel_*
                </code>{' '}
                &mdash; Vercel Analytics &amp; Speed Insights
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {tCommon('cancel')}
          </Button>
          <Button size="sm" onClick={() => savePreferences(analytics)}>
            {t('savePreferences')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
