import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { createServiceClient } from '@/lib/supabase-utils';
import { revalidateDiscovery } from '@/lib/cache-invalidation';

async function toggleLike(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await requireUser();
  if (!user) return unauthorised();

  const { id } = await params;

  if (!isValidUuid(id)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid problem set ID format', 400),
      { status: 400 }
    );
  }

  try {
    const serviceClient = createServiceClient();

    // Verify the problem set is non-private (public and limited sets can be liked)
    const { data: problemSet } = await serviceClient
      .from('problem_sets')
      .select('sharing_level')
      .eq('id', id)
      .single();

    if (!problemSet || problemSet.sharing_level === 'private') {
      return NextResponse.json(
        createApiErrorResponse(
          'Only public or shared problem sets can be liked',
          403
        ),
        { status: 403 }
      );
    }

    // Toggle the like via database function
    const { data, error } = await serviceClient.rpc('toggle_problem_set_like', {
      p_problem_set_id: id,
      p_user_id: user.id,
    });

    if (error) {
      return NextResponse.json(
        createApiErrorResponse('Failed to toggle like', 500, error.message),
        { status: 500 }
      );
    }

    const result = data?.[0] || { liked: false, like_count: 0 };

    // Revalidate discovery cache in the background
    revalidateDiscovery().catch(() => {});

    return NextResponse.json(
      createApiSuccessResponse({
        liked: result.liked,
        like_count: Number(result.like_count),
      })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(toggleLike, { rateLimitType: 'api' });
