import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { UpdateAttemptDto } from '@/lib/schemas';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import { updateReviewSchedule } from '@/lib/spaced-repetition';
import { createServiceClient } from '@/lib/supabase-utils';
import { revalidateProblemAndSubject } from '@/lib/cache-invalidation';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id: attemptId } = await params;
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      createApiErrorResponse(
        ERROR_MESSAGES.INVALID_REQUEST,
        400,
        error as string
      ),
      { status: 400 }
    );
  }

  const parsed = UpdateAttemptDto.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      createApiErrorResponse(
        'Invalid request body',
        400,
        parsed.error.flatten()
      ),
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('attempts')
      .update(parsed.data)
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          error.message
        ),
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
        { status: 404 }
      );
    }

    // Sync problem status and recalculate review schedule when selected_status is updated
    if (parsed.data.selected_status !== undefined) {
      // Get problem for subject_id (needed for cache invalidation)
      const { data: problem } = await supabase
        .from('problems')
        .select('subject_id')
        .eq('id', data.problem_id)
        .single();

      if (parsed.data.selected_status) {
        await supabase
          .from('problems')
          .update({
            status: parsed.data.selected_status,
            last_reviewed_date: new Date().toISOString(),
          })
          .eq('id', data.problem_id)
          .eq('user_id', user.id);

        try {
          const serviceClient = createServiceClient();
          await updateReviewSchedule(
            serviceClient,
            user.id,
            data.problem_id,
            parsed.data.selected_status
          );
        } catch (e) {
          console.error('Failed to update review schedule:', e);
        }
      }

      // Invalidate caches
      if (problem) {
        await revalidateProblemAndSubject(data.problem_id, problem.subject_id);
      }
    }

    return NextResponse.json(createApiSuccessResponse(data));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}
