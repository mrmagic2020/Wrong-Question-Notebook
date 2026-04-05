import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { createServiceClient } from '@/lib/supabase-utils';

export const revalidate = 60; // 1 minute

async function getStats(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await requireUser();
  const { id } = await params;

  if (!isValidUuid(id)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid problem set ID format', 400),
      { status: 400 }
    );
  }

  try {
    const serviceClient = createServiceClient();

    // Fetch stats (public data)
    const { data: stats } = await serviceClient
      .from('problem_set_stats')
      .select(
        'view_count, unique_view_count, like_count, copy_count, problem_count, ranking_score'
      )
      .eq('problem_set_id', id)
      .maybeSingle();

    const response: Record<string, unknown> = {
      stats: stats || {
        view_count: 0,
        unique_view_count: 0,
        like_count: 0,
        copy_count: 0,
        problem_count: 0,
        ranking_score: 0,
      },
    };

    // If authenticated, include user's like and favourite status
    if (user) {
      const [likeResult, favResult] = await Promise.all([
        serviceClient
          .from('problem_set_likes')
          .select('user_id')
          .eq('user_id', user.id)
          .eq('problem_set_id', id)
          .maybeSingle(),
        serviceClient
          .from('problem_set_favourites')
          .select('user_id')
          .eq('user_id', user.id)
          .eq('problem_set_id', id)
          .maybeSingle(),
      ]);

      response.social_state = {
        liked: !!likeResult.data,
        favourited: !!favResult.data,
      };
    }

    return NextResponse.json(createApiSuccessResponse(response));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getStats, { rateLimitType: 'readOnly' });
