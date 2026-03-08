import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidTimezone,
  getTodayInTimezone,
  toDateInTimezone,
  isSameDayInTimezone,
  toMidnightUTC,
  getLocalMidnightAfterDays,
  DEFAULT_TIMEZONE,
} from '../timezone-utils';

describe('isValidTimezone', () => {
  it('accepts valid IANA timezones', () => {
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('America/New_York')).toBe(true);
    expect(isValidTimezone('Asia/Shanghai')).toBe(true);
    expect(isValidTimezone('Europe/London')).toBe(true);
    expect(isValidTimezone('Pacific/Auckland')).toBe(true);
  });

  it('rejects invalid timezone strings', () => {
    expect(isValidTimezone('Invalid/Zone')).toBe(false);
    expect(isValidTimezone('Not_A_Timezone')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
  });
});

describe('DEFAULT_TIMEZONE', () => {
  it('is UTC', () => {
    expect(DEFAULT_TIMEZONE).toBe('UTC');
  });
});

describe('toDateInTimezone', () => {
  it('converts a Date to YYYY-MM-DD in the given timezone', () => {
    // 2025-01-15 23:00 UTC is Jan 15 in UTC, but Jan 16 in UTC+12
    const utcDate = new Date('2025-01-15T23:00:00Z');

    expect(toDateInTimezone(utcDate, 'UTC')).toBe('2025-01-15');
    expect(toDateInTimezone(utcDate, 'Pacific/Auckland')).toBe('2025-01-16');
  });

  it('accepts ISO string input', () => {
    expect(toDateInTimezone('2025-06-15T10:00:00Z', 'UTC')).toBe('2025-06-15');
  });

  it('handles date boundary crossing (UTC midnight)', () => {
    // Just before midnight UTC
    const beforeMidnight = new Date('2025-03-10T23:30:00Z');
    // In UTC it's Mar 10, in UTC-5 (New York, standard time) it's also Mar 10
    expect(toDateInTimezone(beforeMidnight, 'UTC')).toBe('2025-03-10');
    expect(toDateInTimezone(beforeMidnight, 'America/New_York')).toBe(
      '2025-03-10'
    );

    // In UTC+8 (Shanghai) it's already Mar 11
    expect(toDateInTimezone(beforeMidnight, 'Asia/Shanghai')).toBe(
      '2025-03-11'
    );
  });

  it('falls back to UTC for invalid timezone', () => {
    const date = new Date('2025-06-15T12:00:00Z');
    expect(toDateInTimezone(date, 'Invalid/Zone')).toBe('2025-06-15');
  });
});

describe('getTodayInTimezone', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns today in the given timezone', () => {
    // Set "now" to 2025-07-04 03:00 UTC
    vi.setSystemTime(new Date('2025-07-04T03:00:00Z'));

    // In UTC it's Jul 4
    expect(getTodayInTimezone('UTC')).toBe('2025-07-04');

    // In New York (UTC-4 during EDT) it's still Jul 3
    expect(getTodayInTimezone('America/New_York')).toBe('2025-07-03');

    // In Shanghai (UTC+8) it's Jul 4
    expect(getTodayInTimezone('Asia/Shanghai')).toBe('2025-07-04');
  });
});

describe('isSameDayInTimezone', () => {
  it('returns true for same calendar day', () => {
    const a = new Date('2025-06-15T08:00:00Z');
    const b = new Date('2025-06-15T20:00:00Z');
    expect(isSameDayInTimezone(a, b, 'UTC')).toBe(true);
  });

  it('returns false for different calendar days', () => {
    const a = new Date('2025-06-15T23:00:00Z');
    const b = new Date('2025-06-16T01:00:00Z');
    expect(isSameDayInTimezone(a, b, 'UTC')).toBe(false);
  });

  it('respects timezone when determining day boundary', () => {
    // 2025-06-15 23:30 UTC and 2025-06-16 00:30 UTC
    const a = new Date('2025-06-15T23:30:00Z');
    const b = new Date('2025-06-16T00:30:00Z');

    // In UTC, these are different days
    expect(isSameDayInTimezone(a, b, 'UTC')).toBe(false);

    // In America/New_York (UTC-4), both are Jun 15
    expect(isSameDayInTimezone(a, b, 'America/New_York')).toBe(true);
  });

  it('handles DST transitions', () => {
    // US DST spring forward: Mar 9, 2025 at 2:00 AM
    const beforeDST = new Date('2025-03-09T06:00:00Z'); // 1 AM EST
    const afterDST = new Date('2025-03-09T08:00:00Z'); // 4 AM EDT

    // Both are still March 9 in New York
    expect(isSameDayInTimezone(beforeDST, afterDST, 'America/New_York')).toBe(
      true
    );
  });

  it('accepts string dates', () => {
    expect(
      isSameDayInTimezone('2025-06-15T10:00:00Z', '2025-06-15T22:00:00Z', 'UTC')
    ).toBe(true);
  });
});

describe('toMidnightUTC', () => {
  it('returns midnight UTC for UTC timezone', () => {
    const result = toMidnightUTC('2026-03-09', 'UTC');
    expect(result.toISOString()).toBe('2026-03-09T00:00:00.000Z');
  });

  it('returns correct UTC time for EST (UTC-5)', () => {
    // Midnight in New York (EST) = 05:00 UTC
    const result = toMidnightUTC('2026-01-15', 'America/New_York');
    expect(result.toISOString()).toBe('2026-01-15T05:00:00.000Z');
  });

  it('returns correct UTC time for EDT (UTC-4)', () => {
    // Midnight in New York during EDT = 04:00 UTC
    const result = toMidnightUTC('2026-06-15', 'America/New_York');
    expect(result.toISOString()).toBe('2026-06-15T04:00:00.000Z');
  });

  it('returns correct UTC time for positive offset (UTC+8)', () => {
    // Midnight in Shanghai (UTC+8) = previous day 16:00 UTC
    const result = toMidnightUTC('2026-03-09', 'Asia/Shanghai');
    expect(result.toISOString()).toBe('2026-03-08T16:00:00.000Z');
  });

  it('returns correct UTC time for UTC+12', () => {
    // Midnight in Auckland (NZST, UTC+12 standard) = previous day 12:00 UTC
    // In January, Auckland uses NZDT (UTC+13)
    const result = toMidnightUTC('2026-01-15', 'Pacific/Auckland');
    expect(result.toISOString()).toBe('2026-01-14T11:00:00.000Z');
  });

  it('handles DST spring-forward correctly', () => {
    // US DST spring forward: Mar 8, 2026 at 2:00 AM in New York
    // Midnight on Mar 8 (still EST) = 05:00 UTC
    const result = toMidnightUTC('2026-03-08', 'America/New_York');
    expect(result.toISOString()).toBe('2026-03-08T05:00:00.000Z');

    // Midnight on Mar 9 (now EDT) = 04:00 UTC
    const resultAfter = toMidnightUTC('2026-03-09', 'America/New_York');
    expect(resultAfter.toISOString()).toBe('2026-03-09T04:00:00.000Z');
  });

  it('falls back to UTC for invalid timezone', () => {
    const result = toMidnightUTC('2026-03-09', 'Invalid/Zone');
    expect(result.toISOString()).toBe('2026-03-09T00:00:00.000Z');
  });
});

describe('getLocalMidnightAfterDays', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns midnight 1 day from now in UTC', () => {
    vi.setSystemTime(new Date('2026-03-08T15:00:00Z'));
    const result = getLocalMidnightAfterDays(1, 'UTC');
    expect(result.toISOString()).toBe('2026-03-09T00:00:00.000Z');
  });

  it('returns midnight 1 day from now in user timezone', () => {
    // 15:00 UTC = 10:00 ET (Mar 8), so today in ET is Mar 8
    vi.setSystemTime(new Date('2026-03-08T15:00:00Z'));
    const result = getLocalMidnightAfterDays(1, 'America/New_York');
    // DST spring forward is Mar 8, 2026, so Mar 9 is EDT (UTC-4)
    // Mar 9 midnight EDT = Mar 9 04:00 UTC
    expect(result.toISOString()).toBe('2026-03-09T04:00:00.000Z');
  });

  it('handles timezone where "today" is already the next UTC date', () => {
    // 23:00 UTC Mar 8 = Mar 9 07:00 in Shanghai (UTC+8)
    vi.setSystemTime(new Date('2026-03-08T23:00:00Z'));
    const result = getLocalMidnightAfterDays(1, 'Asia/Shanghai');
    // Today in Shanghai is Mar 9, so +1 = Mar 10 midnight Shanghai
    // = Mar 9 16:00 UTC
    expect(result.toISOString()).toBe('2026-03-09T16:00:00.000Z');
  });

  it('handles 3-day interval', () => {
    vi.setSystemTime(new Date('2026-03-08T15:00:00Z'));
    const result = getLocalMidnightAfterDays(3, 'UTC');
    expect(result.toISOString()).toBe('2026-03-11T00:00:00.000Z');
  });
});
