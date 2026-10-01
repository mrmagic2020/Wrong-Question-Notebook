/**
 * Cache invalidation utilities for Vercel Data Cache
 *
 * Provides helper functions for on-demand cache revalidation after data mutations.
 */

import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from './cache-config';
import { createUserDataTag } from './user-data-cache';

/**
 * Expire immediately so the next render reads fresh data (read-your-own-writes).
 * The 'max' profile would instead serve the stale entry once while refetching
 * in the background, so a page refreshed after a save would show old data.
 */
const EXPIRE_NOW = { expire: 0 };

/**
 * Invalidate every per-user page cache (subjects, problems, problem sets,
 * statistics, ...) for one user. Call this from any API route that writes
 * data the user owns. It also invalidates other users' cached views of this
 * user's shared problem sets.
 */
export async function revalidateUserData(userId: string): Promise<void> {
  revalidateTag(createUserDataTag(userId), EXPIRE_NOW);
}

/**
 * Revalidate admin statistics cache
 */
export async function revalidateAdminStats(): Promise<void> {
  revalidateTag(CACHE_TAGS.ADMIN_STATS, 'max');
}

/**
 * Revalidate admin users cache
 */
export async function revalidateAdminUsers(): Promise<void> {
  revalidateTag(CACHE_TAGS.ADMIN_USERS, 'max');
}

/**
 * Revalidate discovery cache (public browse page)
 */
export async function revalidateDiscovery(): Promise<void> {
  revalidateTag(CACHE_TAGS.DISCOVERY, 'max');
}

/**
 * Revalidate sitemap cache (listed public sets)
 */
export async function revalidateSitemap(): Promise<void> {
  revalidateTag(CACHE_TAGS.SITEMAP, 'max');
}
