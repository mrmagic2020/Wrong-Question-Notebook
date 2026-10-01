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
  ADMIN_ACTIVITY: 10 * 60, // 10 minutes

  // Statistics dashboard - 5 minutes
  STATISTICS: 5 * 60, // 5 minutes

  // Review schedule - 5 minutes
  REVIEW_SCHEDULE: 5 * 60, // 5 minutes

  // Insights - 30 minutes (digests are pre-computed daily)
  INSIGHTS: 30 * 60, // 30 minutes

  // Discovery - 2 minutes (public browsing, updated on social actions)
  DISCOVERY: 2 * 60, // 2 minutes

  // Sitemap - 1 hour (listed sets change infrequently)
  SITEMAP: 60 * 60, // 1 hour
} as const;

// Cache tags for organized invalidation
export const CACHE_TAGS = {
  // Shared (not per-user) caches
  ADMIN_STATS: 'admin-stats',
  ADMIN_USERS: 'admin-users',
  DISCOVERY: 'discovery',
  SITEMAP: 'sitemap',

  // Every per-user page cache carries `user-data-{userId}`; see
  // lib/user-data-cache.ts and revalidateUserData() in cache-invalidation.ts
  USER_DATA: 'user-data',
} as const;

// Helper function to create user-specific cache tags
export function createUserCacheTag(baseTag: string, userId: string): string {
  return `${baseTag}-${userId}`;
}
