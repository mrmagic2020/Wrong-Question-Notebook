/**
 * Cache configuration for Vercel Data Cache optimization
 *
 * Conservative cache durations (5-15 minutes) to balance performance with data freshness.
 * All durations are in seconds for Next.js cache configuration.
 */

// Cache durations in seconds
export const CACHE_DURATIONS = {
  // Frequently updated data - 5 minutes
  PROBLEMS: 5 * 60, // 5 minutes
  PROBLEM_SETS: 5 * 60, // 5 minutes
  USER_DATA: 5 * 60, // 5 minutes

  // Relatively stable data - 10 minutes
  SUBJECTS: 10 * 60, // 10 minutes
  TAGS: 10 * 60, // 10 minutes
  ADMIN_USERS: 10 * 60, // 10 minutes

  // Less critical freshness - 15 minutes
  ADMIN_STATS: 15 * 60, // 15 minutes
} as const;

// Cache tags for organized invalidation
export const CACHE_TAGS = {
  // Data type tags
  SUBJECTS: 'subjects',
  PROBLEMS: 'problems',
  PROBLEM_SETS: 'problem-sets',
  REVIEW_SESSIONS: 'review-sessions',
  TAGS: 'tags',
  ADMIN_STATS: 'admin-stats',
  ADMIN_USERS: 'admin-users',

  // User-specific tags (will be combined with user ID)
  USER_SUBJECTS: 'user-subjects',
  USER_PROBLEMS: 'user-problems',
  USER_PROBLEM_SETS: 'user-problem-sets',
  USER_REVIEW_SESSIONS: 'user-review-sessions',
  USER_TAGS: 'user-tags',
} as const;

// Helper function to create user-specific cache tags
export function createUserCacheTag(baseTag: string, userId: string): string {
  return `${baseTag}-${userId}`;
}

// Helper function to create subject-specific cache tags
export function createSubjectCacheTag(
  baseTag: string,
  subjectId: string
): string {
  return `${baseTag}-${subjectId}`;
}

// Helper function to create problem set-specific cache tags
export function createProblemSetCacheTag(
  baseTag: string,
  problemSetId: string
): string {
  return `${baseTag}-${problemSetId}`;
}

// Helper function to create problem-specific cache tags
export function createProblemCacheTag(
  baseTag: string,
  problemId: string
): string {
  return `${baseTag}-${problemId}`;
}

// Cache key patterns for consistent naming
export const CACHE_KEYS = {
  SUBJECTS_LIST: 'subjects-list',
  PROBLEMS_LIST: 'problems-list',
  PROBLEM_SETS_LIST: 'problem-sets-list',
  TAGS_LIST: 'tags-list',
  ADMIN_STATISTICS: 'admin-statistics',
  ADMIN_USERS_LIST: 'admin-users-list',
} as const;

// Type definitions for better TypeScript support
export type CacheDuration =
  (typeof CACHE_DURATIONS)[keyof typeof CACHE_DURATIONS];
export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];
export type CacheKey = (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS];
