/**
 * Common utility functions used across the application
 * Consolidates shared logic and reduces code duplication
 */

import { ERROR_MESSAGES } from './constants';
import { logger } from './logger';

// =====================================================
// Date and Time Utilities
// =====================================================

export function formatDisplayDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
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

export function formatDisplayDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return formatDisplayDateTime(dateString);
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

export function getColumnDisplayName(columnId: string): string {
  const displayNames: Record<string, string> = {
    select: 'Select',
    title: 'Title',
    problem_type: 'Problem Type',
    tags: 'Tags',
    status: 'Status',
    created_at: 'Date Created',
    updated_at: 'Updated',
    last_reviewed_date: 'Last Reviewed',
    actions: 'Actions',
  };

  return (
    displayNames[columnId] ||
    columnId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}

export function getProblemTypeDisplayName(type: string): string {
  const displayNames: Record<string, string> = {
    mcq: 'Multiple Choice',
    short: 'Short Answer',
    extended: 'Extended Response',
  };

  return displayNames[type] || type;
}

export function getProblemStatusDisplayName(status: string): string {
  const displayNames: Record<string, string> = {
    wrong: 'Wrong',
    needs_review: 'Needs Review',
    mastered: 'Mastered',
  };

  return displayNames[status] || status;
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
  return {
    error: message,
    status,
    ...(details && { details }),
    timestamp: new Date().toISOString(),
  };
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
