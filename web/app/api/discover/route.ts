import { NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { createServiceClient } from '@/lib/supabase-utils';
import { PROBLEM_SET_CONSTANTS } from '@/lib/constants';

export const revalidate = 120; // 2 minutes

type SortOption = 'ranking' | 'newest' | 'most_liked' | 'most_copied';

// Cursor format: "value:id" for composite keyset pagination
function encodeCursor(value: string | number, id: string): string {
  return `${value}:${id}`;
}

function decodeCursor(cursor: string): { value: string; id: string } | null {
  const idx = cursor.lastIndexOf(':');
  if (idx === -1) return null;
  return { value: cursor.slice(0, idx), id: cursor.slice(idx + 1) };
}

/**
 * Validate and decode a pagination cursor, ensuring the id is a valid UUID
 * and the value matches the expected type for the sort mode.
 * Prevents PostgREST filter injection via crafted cursor strings.
 */
function validateCursor(
  cursor: string,
  sort: SortOption
): { value: string; id: string } | null {
  const parsed = decodeCursor(cursor);
  if (!parsed) return null;

  if (!isValidUuid(parsed.id)) return null;

  switch (sort) {
    case 'newest':
      if (isNaN(Date.parse(parsed.value))) return null;
      break;
    case 'most_liked':
    case 'most_copied':
    case 'ranking':
    default:
      if (isNaN(Number(parsed.value)) || !isFinite(Number(parsed.value)))
        return null;
      break;
  }

  return parsed;
}

async function discoverProblemSets(req: Request) {
  const url = new URL(req.url);
  const limitParam = parseInt(
    url.searchParams.get('limit') ||
      String(PROBLEM_SET_CONSTANTS.DISCOVERY_PAGE_SIZE)
  );
  const limit = Math.min(
    Math.max(1, limitParam),
    PROBLEM_SET_CONSTANTS.DISCOVERY_MAX_PAGE_SIZE
  );
  const cursor = url.searchParams.get('cursor');
  const q = url.searchParams.get('q')?.trim();
  const subject = url.searchParams.get('subject')?.trim();
  const sort = (url.searchParams.get('sort') || 'ranking') as SortOption;

  try {
    const serviceClient = createServiceClient();

    // Query the flattened view — all columns are direct, so ordering
    // and cursor-based pagination work natively in SQL.
    let query = serviceClient.from('discoverable_problem_sets').select('*');

    // Full-text search (fts is a direct column on the view)
    if (q) {
      query = query.textSearch('fts', q, { type: 'websearch' });
    }

    // Subject filter
    if (subject) {
      query = query.eq('discovery_subject', subject);
    }

    // Sorting + cursor-based keyset pagination
    const parsed = cursor ? validateCursor(cursor, sort) : null;

    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        if (parsed) {
          query = query.or(
            `created_at.lt.${parsed.value},and(created_at.eq.${parsed.value},id.lt.${parsed.id})`
          );
        }
        break;
      case 'most_liked':
        query = query
          .order('like_count', { ascending: false })
          .order('id', { ascending: false });
        if (parsed) {
          query = query.or(
            `like_count.lt.${parsed.value},and(like_count.eq.${parsed.value},id.lt.${parsed.id})`
          );
        }
        break;
      case 'most_copied':
        query = query
          .order('copy_count', { ascending: false })
          .order('id', { ascending: false });
        if (parsed) {
          query = query.or(
            `copy_count.lt.${parsed.value},and(copy_count.eq.${parsed.value},id.lt.${parsed.id})`
          );
        }
        break;
      case 'ranking':
      default:
        query = query
          .order('ranking_score', { ascending: false })
          .order('id', { ascending: false });
        if (parsed) {
          query = query.or(
            `ranking_score.lt.${parsed.value},and(ranking_score.eq.${parsed.value},id.lt.${parsed.id})`
          );
        }
        break;
    }

    // Fetch one extra to determine if there's a next page
    query = query.limit(limit + 1);

    const { data: rawSets, error } = await query;

    if (error) {
      return NextResponse.json(
        createApiErrorResponse(
          'Failed to fetch discovery data',
          500,
          error.message
        ),
        { status: 500 }
      );
    }

    const sets = rawSets || [];
    const hasMore = sets.length > limit;
    const pageData = hasMore ? sets.slice(0, limit) : sets;

    // Fetch owner profiles separately (no direct FK to user_profiles)
    const ownerIds = [
      ...new Set(pageData.map((s: any) => s.user_id).filter(Boolean)),
    ];
    const profileMap = new Map<
      string,
      {
        username: string | null;
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
      }
    >();
    if (ownerIds.length > 0) {
      const { data: profiles } = await serviceClient
        .from('user_profiles')
        .select('id, username, first_name, last_name, avatar_url')
        .in('id', ownerIds);
      for (const p of profiles || []) {
        profileMap.set(p.id, p);
      }
    }

    // Transform into ProblemSetCard format
    const data = pageData.map((set: any) => {
      const profile = profileMap.get(set.user_id);
      const displayName =
        [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
        profile?.username ||
        'Anonymous';

      return {
        id: set.id,
        name: set.name,
        description: set.description,
        subject_name: set.discovery_subject || 'Other',
        subject_color: null,
        subject_icon: null,
        problem_count: set.problem_count || 0,
        is_smart: set.is_smart,
        owner: {
          username: profile?.username || null,
          display_name: displayName,
          avatar_url: profile?.avatar_url || null,
        },
        stats: {
          view_count: set.view_count || 0,
          unique_view_count: set.unique_view_count || 0,
          like_count: set.like_count || 0,
          copy_count: set.copy_count || 0,
          problem_count: set.problem_count || 0,
          ranking_score: set.ranking_score || 0,
        },
        created_at: set.created_at,
      };
    });

    // Determine next cursor
    let nextCursor: string | null = null;
    if (hasMore && pageData.length > 0) {
      const last = pageData[pageData.length - 1] as any;
      switch (sort) {
        case 'newest':
          nextCursor = encodeCursor(last.created_at, last.id);
          break;
        case 'most_liked':
          nextCursor = encodeCursor(last.like_count, last.id);
          break;
        case 'most_copied':
          nextCursor = encodeCursor(last.copy_count, last.id);
          break;
        case 'ranking':
        default:
          nextCursor = encodeCursor(last.ranking_score, last.id);
          break;
      }
    }

    // Fetch discovery subject counts via DB-side aggregation (GROUP BY)
    const { data: subjectRows } = await serviceClient.rpc(
      'get_discovery_subject_counts'
    );

    const subjects: { name: string; count: number }[] = (
      (subjectRows || []) as { name: string; count: number }[]
    ).map(row => ({ name: row.name, count: Number(row.count) }));

    return NextResponse.json(
      createApiSuccessResponse({
        data,
        next_cursor: nextCursor,
        subjects,
      })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(discoverProblemSets, {
  rateLimitType: 'readOnly',
});
