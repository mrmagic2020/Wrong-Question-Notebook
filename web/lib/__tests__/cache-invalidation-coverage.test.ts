import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Per-user pages are served from the Data Cache (lib/user-data-cache.ts), so
 * any API route that writes data those pages show must call
 * revalidateUserData(), or users see stale data after saving. This test makes
 * every new mutating route either invalidate or be listed below with a reason.
 */

const API_DIR = join(__dirname, '..', '..', 'app', 'api');

/** Route paths (relative to app/api) that write nothing a cached page shows. */
const EXEMPT: Record<string, string> = {
  'ai/extract-problem': 'only records AI usage quota',
  'files/delete': 'removes storage objects; references live on problems',
  'insights/generate': 'digests are shown on uncached insights pages only',
  'onboarding/complete': 'onboarding flag is not shown on cached pages',
  'problem-sets/[id]/favourite':
    'favourites are fetched client-side from /api/problem-sets/favourites',
  'problem-sets/[id]/like':
    'changes counts on another user’s set; refreshed by TTL and discovery',
  'problem-sets/[id]/report': 'moderation queue only',
  'problem-sets/[id]/view': 'view counters only',
  'problems/[id]/cleanup': 'deletes files of a problem that was never saved',
  'problems/filter-count': 'POST is a read-only count query',
  'qr-sessions': 'temporary upload handoff',
  'qr-sessions/[sessionId]/consume': 'temporary upload handoff',
  'qr-upload/[sessionId]': 'temporary upload handoff',
};

/** Admin tooling: target users' caches expire by TTL. */
const EXEMPT_PREFIXES = ['admin/'];

const MUTATING_EXPORT =
  /export\s+(?:async\s+function|const)\s+(POST|PUT|PATCH|DELETE)\b/;

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter(f => f.endsWith(`${sep}route.ts`) || f === 'route.ts')
    .map(f => join(dir, f));
}

function routePath(file: string): string {
  return relative(API_DIR, file).split(sep).slice(0, -1).join('/');
}

describe('cache invalidation coverage', () => {
  const mutating = routeFiles(API_DIR)
    .map(file => ({ file, source: readFileSync(file, 'utf8') }))
    .filter(({ source }) => MUTATING_EXPORT.test(source));

  it('finds mutating routes to check', () => {
    expect(mutating.length).toBeGreaterThan(10);
  });

  it('every mutating route invalidates user data or is exempt', () => {
    const missing = mutating
      .map(({ file, source }) => ({ path: routePath(file), source }))
      .filter(
        ({ path, source }) =>
          !source.includes('revalidateUserData(') &&
          !(path in EXEMPT) &&
          !EXEMPT_PREFIXES.some(prefix => path.startsWith(prefix))
      )
      .map(({ path }) => path);

    expect(missing).toEqual([]);
  });

  it('exempt routes still exist and do not also invalidate', () => {
    const byPath = new Map(
      mutating.map(({ file, source }) => [routePath(file), source])
    );
    for (const path of Object.keys(EXEMPT)) {
      expect(byPath.has(path), `${path} is not a mutating route`).toBe(true);
      expect(
        byPath.get(path)?.includes('revalidateUserData('),
        `${path} invalidates, so it should not be exempt`
      ).toBe(false);
    }
  });
});
