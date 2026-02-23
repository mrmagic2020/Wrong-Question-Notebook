'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { COOKIE_CONSENT_CONSTANTS } from '@/lib/constants';
import { ConsentBanner } from './consent-banner';
import { ConsentDialog } from './consent-dialog';

interface CookieConsent {
  v: number;
  essential: boolean;
  analytics: boolean;
  decidedAt: string;
}

interface ConsentContextValue {
  consent: CookieConsent | null;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (analytics: boolean) => void;
  openPreferences: () => void;
  isDialogOpen: boolean;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error('useConsent must be used within <ConsentProvider>');
  }
  return ctx;
}

function readConsentCookie(): CookieConsent | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${COOKIE_CONSENT_CONSTANTS.COOKIE_NAME}=`));

  if (!match) return null;

  try {
    const parsed: CookieConsent = JSON.parse(
      decodeURIComponent(match.split('=')[1])
    );
    if (parsed.v !== COOKIE_CONSENT_CONSTANTS.CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeConsentCookie(consent: CookieConsent) {
  const value = encodeURIComponent(JSON.stringify(consent));
  const isSecure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  const flags = [
    `path=/`,
    `max-age=${COOKIE_CONSENT_CONSTANTS.MAX_AGE_SECONDS}`,
    `SameSite=Lax`,
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

  document.cookie = `${COOKIE_CONSENT_CONSTANTS.COOKIE_NAME}=${value}; ${flags}`;
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setConsent(readConsentCookie());
    setMounted(true);
  }, []);

  const save = useCallback((analytics: boolean) => {
    const next: CookieConsent = {
      v: COOKIE_CONSENT_CONSTANTS.CONSENT_VERSION,
      essential: true,
      analytics,
      decidedAt: new Date().toISOString(),
    };
    writeConsentCookie(next);
    setConsent(next);
    setIsDialogOpen(false);
  }, []);

  const acceptAll = useCallback(() => save(true), [save]);
  const rejectAll = useCallback(() => save(false), [save]);
  const savePreferences = useCallback(
    (analytics: boolean) => save(analytics),
    [save]
  );
  const openPreferences = useCallback(() => setIsDialogOpen(true), []);

  return (
    <ConsentContext.Provider
      value={{
        consent,
        acceptAll,
        rejectAll,
        savePreferences,
        openPreferences,
        isDialogOpen,
      }}
    >
      {children}
      {mounted && !consent && <ConsentBanner />}
      <ConsentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </ConsentContext.Provider>
  );
}
