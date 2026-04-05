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
import { checkProblemSetAccess } from '@/lib/problem-set-utils';

async function toggleFavourite(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id } = await params;

  if (!isValidUuid(id)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid problem set ID format', 400),
      { status: 400 }
    );
  }

  try {
    // Verify the problem set exists and user has access
    const serviceClient = createServiceClient();
    const { data: problemSet } = await serviceClient
      .from('problem_sets')
      .select('user_id, sharing_level')
      .eq('id', id)
      .single();

    if (!problemSet) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found', 404),
        { status: 404 }
      );
    }

    const hasAccess = await checkProblemSetAccess(
      serviceClient,
      problemSet,
      user.id,
      user.email || null,
      id
    );

    if (!hasAccess) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found', 404),
        { status: 404 }
      );
    }

    // Check if already favourited
    const { data: existing } = await supabase
      .from('problem_set_favourites')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('problem_set_id', id)
      .maybeSingle();

    if (existing) {
      // Unfavourite
      const { error } = await supabase
        .from('problem_set_favourites')
        .delete()
        .eq('user_id', user.id)
        .eq('problem_set_id', id);

      if (error) {
        return NextResponse.json(
          createApiErrorResponse(
            'Failed to remove favourite',
            500,
            error.message
          ),
          { status: 500 }
        );
      }

      return NextResponse.json(createApiSuccessResponse({ favourited: false }));
    } else {
      // Favourite
      const { error } = await supabase
        .from('problem_set_favourites')
        .insert({ user_id: user.id, problem_set_id: id });

      if (error) {
        return NextResponse.json(
          createApiErrorResponse('Failed to add favourite', 500, error.message),
          { status: 500 }
        );
      }

      return NextResponse.json(createApiSuccessResponse({ favourited: true }));
    }
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(toggleFavourite, { rateLimitType: 'api' });
