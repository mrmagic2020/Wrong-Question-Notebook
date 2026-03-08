/**
 * Timezone-aware day-boundary utilities.
 *
 * All helpers use the IANA timezone string stored in `user_profiles.timezone`
 * (e.g. "America/New_York", "Asia/Shanghai"). They fall back to UTC when the
 * timezone is missing or invalid.
 */

import { createServiceClient } from './supabase-utils';

export const DEFAULT_TIMEZONE = 'UTC';

// =====================================================
// Validation
// =====================================================

/**
 * Check whether `tz` is a valid IANA timezone identifier.
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// =====================================================
// Date helpers
// =====================================================

/**
 * Get today's date (YYYY-MM-DD) in the given timezone.
 */
export function getTodayInTimezone(tz: string): string {
  return toDateInTimezone(new Date(), tz);
}

/**
 * Convert a Date or ISO string to a YYYY-MM-DD string in the given timezone.
 */
export function toDateInTimezone(date: Date | string, tz: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const safeTz = isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;

  // Intl.DateTimeFormat gives us locale-independent date parts
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;

  return `${year}-${month}-${day}`;
}

/**
 * Check whether two timestamps fall on the same calendar date in the given
 * timezone.
 */
export function isSameDayInTimezone(
  a: Date | string,
  b: Date | string,
  tz: string
): boolean {
  return toDateInTimezone(a, tz) === toDateInTimezone(b, tz);
}

// =====================================================
// Midnight conversion
// =====================================================

/**
 * Returns the UTC Date corresponding to midnight (00:00) on the given
 * calendar date in the specified timezone.
 *
 * Example: toMidnightUTC('2026-03-09', 'America/New_York')
 *        → Date representing 2026-03-09T05:00:00Z (EST = UTC-5)
 */
export function toMidnightUTC(dateStr: string, tz: string): Date {
  const safeTz = isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
  const [y, m, d] = dateStr.split('-').map(Number);

  // Iteratively find the UTC instant whose local representation is midnight
  let estimateMs = Date.UTC(y, m - 1, d, 0, 0, 0);

  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: safeTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(new Date(estimateMs));

    const lY = parseInt(parts.find(p => p.type === 'year')!.value);
    const lM = parseInt(parts.find(p => p.type === 'month')!.value);
    const lD = parseInt(parts.find(p => p.type === 'day')!.value);
    let lH = parseInt(parts.find(p => p.type === 'hour')!.value);
    const lMin = parseInt(parts.find(p => p.type === 'minute')!.value);
    const lS = parseInt(parts.find(p => p.type === 'second')!.value);

    // Some engines format midnight as 24:00 with hour12:false
    if (lH === 24) lH = 0;

    const localMs = Date.UTC(lY, lM - 1, lD, lH, lMin, lS);
    const targetMs = Date.UTC(y, m - 1, d, 0, 0, 0);
    const diffMs = localMs - targetMs;

    if (diffMs === 0) break;
    estimateMs -= diffMs;
  }

  return new Date(estimateMs);
}

/**
 * Returns the UTC Date for midnight (00:00) in the user's timezone,
 * `daysFromNow` calendar days after today.
 */
export function getLocalMidnightAfterDays(
  daysFromNow: number,
  tz: string
): Date {
  const todayStr = toDateInTimezone(new Date(), tz);
  // Use noon UTC to avoid DST-related date shifts during arithmetic
  const baseDate = new Date(todayStr + 'T12:00:00Z');
  baseDate.setUTCDate(baseDate.getUTCDate() + daysFromNow);
  const targetStr = `${baseDate.getUTCFullYear()}-${String(baseDate.getUTCMonth() + 1).padStart(2, '0')}-${String(baseDate.getUTCDate()).padStart(2, '0')}`;
  return toMidnightUTC(targetStr, tz);
}

// =====================================================
// User timezone resolution
// =====================================================

/**
 * Look up the timezone for a user from `user_profiles`.
 * Falls back to 'UTC' on any error or missing value.
 */
export async function getUserTimezone(userId: string): Promise<string> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('timezone')
      .eq('id', userId)
      .single();

    if (error || !data?.timezone) return DEFAULT_TIMEZONE;
    return isValidTimezone(data.timezone) ? data.timezone : DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}
