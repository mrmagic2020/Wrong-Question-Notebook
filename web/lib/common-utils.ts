/**
 * Common utility functions used across the application
 * Consolidates shared logic and reduces code duplication
 */

import { ERROR_MESSAGES } from './constants';
import { logger } from './logger';

// =====================================================
// Date and Time Utilities
// =====================================================

/** Map next-intl locale codes to BCP 47 tags for Intl APIs */
const localeMap: Record<string, string> = {
  'zh-CN': 'zh-CN',
  en: 'en-US',
};

function resolveIntlLocale(locale?: string): string {
  if (locale) return localeMap[locale] || locale;
  // Auto-detect from <html lang> on client
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.lang;
    if (htmlLang) return localeMap[htmlLang] || htmlLang;
  }
  return 'en-US';
}

export function formatDisplayDateTime(
  dateString: string,
  locale?: string
): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString(resolveIntlLocale(locale), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    logger.error('Error formatting date', error, {
      component: 'Utils',
      action: 'formatDisplayDateTime',
    });
    return ERROR_MESSAGES.INVALID_DATE;
  }
}

export function formatDisplayDate(dateString: string, locale?: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(resolveIntlLocale(locale), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    logger.error('Error formatting date', error, {
      component: 'Utils',
      action: 'formatDisplayDate',
    });
    return ERROR_MESSAGES.INVALID_DATE;
  }
}

export function formatRelativeTime(
  dateString: string,
  locale?: string
): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const resolvedLocale = resolveIntlLocale(locale);

    const rtf = new Intl.RelativeTimeFormat(resolvedLocale, {
      numeric: 'auto',
    });

    if (diffInSeconds < 60) {
      return rtf.format(0, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 604800) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else {
      return formatDisplayDateTime(dateString, locale);
    }
  } catch (error) {
    logger.error('Error formatting relative time', error, {
      component: 'Utils',
      action: 'formatRelativeTime',
    });
    return ERROR_MESSAGES.INVALID_DATE;
  }
}

// =====================================================
// String Utilities
// =====================================================

const COLUMN_DISPLAY_NAMES = {
  select: 'selectColumn',
  title: 'titleColumn',
  problem_type: 'problemTypeColumn',
  tags: 'tagsColumn',
  status: 'statusColumn',
  created_at: 'dateCreatedColumn',
  updated_at: 'updatedColumn',
  last_reviewed_date: 'lastReviewedColumn',
  actions: 'actionsColumn',
} as const;

export type ColumnDisplayKey =
  (typeof COLUMN_DISPLAY_NAMES)[keyof typeof COLUMN_DISPLAY_NAMES];

export function getColumnDisplayName(columnId: string): ColumnDisplayKey {
  return (
    COLUMN_DISPLAY_NAMES[columnId as keyof typeof COLUMN_DISPLAY_NAMES] ??
    ('selectColumn' as ColumnDisplayKey)
  );
}

const PROBLEM_TYPE_DISPLAY_NAMES = {
  mcq: 'multipleChoiceType',
  short: 'shortAnswerType',
  extended: 'extendedResponseType',
} as const;

export type ProblemTypeDisplayKey =
  (typeof PROBLEM_TYPE_DISPLAY_NAMES)[keyof typeof PROBLEM_TYPE_DISPLAY_NAMES];

export function getProblemTypeDisplayName(type: string): ProblemTypeDisplayKey {
  return (
    PROBLEM_TYPE_DISPLAY_NAMES[
      type as keyof typeof PROBLEM_TYPE_DISPLAY_NAMES
    ] ?? 'multipleChoiceType'
  );
}

const PROBLEM_STATUS_DISPLAY_NAMES = {
  wrong: 'wrongStatus',
  needs_review: 'needsReviewStatus',
  mastered: 'masteredStatus',
} as const;

export type ProblemStatusDisplayKey =
  (typeof PROBLEM_STATUS_DISPLAY_NAMES)[keyof typeof PROBLEM_STATUS_DISPLAY_NAMES];

export function getProblemStatusDisplayName(
  status: string
): ProblemStatusDisplayKey {
  return (
    PROBLEM_STATUS_DISPLAY_NAMES[
      status as keyof typeof PROBLEM_STATUS_DISPLAY_NAMES
    ] ?? 'wrongStatus'
  );
}

export function getStatusBorderColor(status: string): string {
  switch (status) {
    case 'wrong':
      return 'border-l-red-300 dark:border-l-red-400/60';
    case 'needs_review':
      return 'border-l-amber-300 dark:border-l-amber-400/60';
    case 'mastered':
      return 'border-l-green-300 dark:border-l-green-400/60';
    default:
      return '';
  }
}

export function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case 'wrong':
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    case 'needs_review':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    case 'mastered':
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    default:
      return '';
  }
}

// =====================================================
// Error Handling Utilities
// =====================================================

export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: string[]
) {
  return {
    error: message,
    ...(details && { details }),
    status,
  };
}

/**
 * Create standardized error response for API endpoints
 */
export function createApiErrorResponse(
  message: string,
  status: number = 500,
  details?: unknown
) {
  const response: {
    error: string;
    status: number;
    details?: unknown;
    timestamp: string;
  } = {
    error: message,
    status,
    timestamp: new Date().toISOString(),
  };

  if (details !== undefined) {
    response.details = details;
  }

  return response;
}

/**
 * Create standardized success response for API endpoints
 */
export function createApiSuccessResponse<T>(data: T, message?: string) {
  return {
    data,
    success: true,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  };
}

export function handleAsyncError(error: unknown): {
  message: string;
  status: number;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500,
    };
  }

  return {
    message: ERROR_MESSAGES.INTERNAL_ERROR,
    status: 500,
  };
}

// =====================================================
// Environment Utilities
// =====================================================

export function validateRequiredEnvVars(): boolean {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY',
  ];

  return requiredVars.every(varName => !!process.env[varName]);
}

export function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

// =====================================================
// Type Guards
// =====================================================

export function isValidUuid(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Returns true if all asset paths belong to the given user's storage directory.
 * Rejects foreign asset paths to prevent unauthorized cross-user file access.
 * Copy APIs bypass this check since they legitimately create foreign references.
 */
export function hasOnlyOwnedAssetPaths(
  userId: string,
  assets: Array<{ path: string }> | undefined,
  solutionAssets: Array<{ path: string }> | undefined
): boolean {
  const prefix = `user/${userId}/`;
  const allPaths = [...(assets ?? []), ...(solutionAssets ?? [])];
  return allPaths.every(a => {
    // Reject paths containing traversal segments before the prefix check
    if (a.path.includes('/../') || a.path.includes('/./')) return false;
    return a.path.startsWith(prefix);
  });
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// =====================================================
// Array and Object Utilities
// =====================================================

export function removeDuplicates<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<K, T[]>
  );
}

export function sortBy<T>(
  array: T[],
  keyFn: (item: T) => string | number,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// =====================================================
// Math Utilities
// =====================================================

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundToDecimals(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return roundToDecimals((value / total) * 100, 2);
}

// =====================================================
// Time Utilities
// =====================================================

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
