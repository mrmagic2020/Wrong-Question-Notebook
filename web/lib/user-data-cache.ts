import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, createUserCacheTag } from './cache-config';

/** Tag carried by every cache entry that holds a user's own data. */
export function createUserDataTag(userId: string): string {
  return createUserCacheTag(CACHE_TAGS.USER_DATA, userId);
}

interface UserDataCacheOptions {
  /** The user whose data is being cached (usually the viewer). */
  userId: string;
  /**
   * Everything besides userId that changes the result, e.g. a resource id
   * or the viewer's timezone. Values must be stable across requests.
   */
  key: string[];
  /** Seconds before the entry expires on its own. */
  revalidate: number;
  /**
   * Users whose writes should also invalidate this entry, e.g. the owner of
   * a shared problem set being viewed by someone else.
   */
  alsoInvalidatedBy?: string[];
}

/**
 * Caches per-user page data in the Next.js Data Cache.
 *
 * `load` takes no arguments on purpose. unstable_cache folds its arguments
 * into the cache key with JSON.stringify, and a Supabase client serialises
 * differently on every request, so passing one in makes every lookup miss.
 * Instead, `load` should close over the request's RLS-scoped client: on a
 * miss it runs as the signed-in user, so RLS and auth.uid()-guarded RPCs
 * keep working, while the key stays `userId + key`.
 *
 * Entries are invalidated by `revalidateUserData(userId)` from
 * lib/cache-invalidation.ts, which every mutating API route must call.
 */
export function cacheUserData<T>(
  load: () => Promise<T>,
  { userId, key, revalidate, alsoInvalidatedBy = [] }: UserDataCacheOptions
): Promise<T> {
  const tags = [userId, ...alsoInvalidatedBy]
    .filter((id, i, all) => all.indexOf(id) === i)
    .map(createUserDataTag);

  return unstable_cache(load, [CACHE_TAGS.USER_DATA, userId, ...key], {
    tags,
    revalidate,
  })();
}
