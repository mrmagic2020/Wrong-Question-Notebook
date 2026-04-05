import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { createServiceClient } from '@/lib/supabase-utils';

async function getFavourites() {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  try {
    // Get the user's favourited problem set IDs
    const { data: favourites, error: favError } = await supabase
      .from('problem_set_favourites')
      .select('problem_set_id')
      .eq('user_id', user.id);

    if (favError) {
      return NextResponse.json(
        createApiErrorResponse(
          'Failed to fetch favourites',
          500,
          favError.message
        ),
        { status: 500 }
      );
    }

    const favIds = (favourites || []).map(f => f.problem_set_id);
    if (favIds.length === 0) {
      return NextResponse.json(createApiSuccessResponse([]));
    }

    // Fetch full set data via service client (bypasses RLS for cross-user sets)
    const serviceClient = createServiceClient();
    const { data: allSets, error: setsError } = await serviceClient
      .from('problem_sets')
      .select('*, subjects(name)')
      .in('id', favIds);

    if (setsError) {
      return NextResponse.json(
        createApiErrorResponse(
          'Failed to fetch favourited sets',
          500,
          setsError.message
        ),
        { status: 500 }
      );
    }

    // Filter to only sets the user can actually access (batched, not N+1)
    // Prefetch all limited shares for this user in one query
    const limitedSetIds = (allSets || [])
      .filter((ps: any) => ps.sharing_level === 'limited')
      .map((ps: any) => ps.id);
    const sharedSetIds = new Set<string>();
    if (limitedSetIds.length > 0) {
      const { data: shares } = await serviceClient
        .from('problem_set_shares')
        .select('problem_set_id')
        .in('problem_set_id', limitedSetIds)
        .ilike('shared_with_email', user.email || '');
      for (const s of shares || []) {
        sharedSetIds.add(s.problem_set_id);
      }
    }

    const sets = (allSets || []).filter((ps: any) => {
      if (ps.user_id === user.id) return true; // own set
      if (ps.sharing_level === 'public') return true;
      if (ps.sharing_level === 'limited') return sharedSetIds.has(ps.id);
      return false; // private
    });

    // Clean up stale favourites for sets the user can no longer access
    const accessibleIds = new Set(sets.map((s: any) => s.id));
    const staleIds = favIds.filter(id => !accessibleIds.has(id));
    if (staleIds.length > 0) {
      await supabase
        .from('problem_set_favourites')
        .delete()
        .eq('user_id', user.id)
        .in('problem_set_id', staleIds);
    }

    // Fetch stats for accessible sets
    const accessibleSetIds = sets.map((s: any) => s.id);
    const { data: stats } =
      accessibleSetIds.length > 0
        ? await serviceClient
            .from('problem_set_stats')
            .select(
              'problem_set_id, view_count, like_count, copy_count, problem_count'
            )
            .in('problem_set_id', accessibleSetIds)
        : { data: [] };

    const statsMap = new Map(
      (stats || []).map((s: any) => [s.problem_set_id, s])
    );

    // Transform
    const result = sets.map((ps: any) => {
      const s = statsMap.get(ps.id);
      return {
        id: ps.id,
        name: ps.name,
        description: ps.description,
        sharing_level: ps.sharing_level,
        subject_name: ps.subjects?.name || 'Unknown',
        is_smart: ps.is_smart,
        allow_copying: ps.allow_copying,
        is_listed: ps.is_listed,
        discovery_subject: ps.discovery_subject,
        created_at: ps.created_at,
        updated_at: ps.updated_at,
        problem_count: s?.problem_count ?? 0,
        isOwner: ps.user_id === user.id,
        stats: s
          ? {
              view_count: s.view_count,
              like_count: s.like_count,
              copy_count: s.copy_count,
            }
          : null,
      };
    });

    return NextResponse.json(createApiSuccessResponse(result));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getFavourites, { rateLimitType: 'readOnly' });
