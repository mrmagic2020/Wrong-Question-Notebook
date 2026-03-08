'use client';

import { useEffect } from 'react';

/**
 * Invisible client component that auto-detects the user's browser timezone
 * on every authenticated page load and syncs it to their profile if it differs.
 */
export function TimezoneSync({
  currentTimezone,
}: {
  currentTimezone: string | null;
}) {
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected || detected === currentTimezone) return;

    // Fire-and-forget PATCH — no need to block UI
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: detected }),
    }).catch(() => {
      // Silently ignore — timezone sync is best-effort
    });
  }, [currentTimezone]);

  return null;
}
