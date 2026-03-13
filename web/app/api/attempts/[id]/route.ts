import { NextResponse, after } from 'next/server';
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
import {
  revalidateProblemAndSubject,
  revalidateUserReviewSchedule,
} from '@/lib/cache-invalidation';
import { getUserTimezone } from '@/lib/timezone-utils';

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

    // Sync problem status and recalculate review schedule when selected_status
    // is updated — but only if this is the latest attempt for the problem.
    // Editing a historical attempt should not overwrite the current status.
    if (parsed.data.selected_status !== undefined) {
      // Fetch problem, latest attempt, and timezone in parallel
      const [{ data: problem }, { data: latestAttempt }, userTimezone] =
        await Promise.all([
          supabase
            .from('problems')
            .select('subject_id')
            .eq('id', data.problem_id)
            .single(),
          supabase
            .from('attempts')
            .select('id')
            .eq('problem_id', data.problem_id)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
          getUserTimezone(user.id),
        ]);

      const isLatestAttempt = latestAttempt?.id === attemptId;

      if (parsed.data.selected_status && isLatestAttempt) {
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
            parsed.data.selected_status,
            userTimezone
          );
          await revalidateUserReviewSchedule(user.id);
        } catch (e) {
          console.error('Failed to update review schedule:', e);
        }
      }

      // Invalidate caches
      if (problem) {
        await revalidateProblemAndSubject(data.problem_id, problem.subject_id);
      }

      // Trigger AI error categorisation after the response is sent
      if (
        (parsed.data.selected_status === 'wrong' ||
          parsed.data.selected_status === 'needs_review') &&
        problem?.subject_id
      ) {
        const origin = new URL(req.url).origin;
        const secret = process.env.CATEGORISATION_SECRET;
        if (secret) {
          const subjectId = problem.subject_id;
          const problemId = data.problem_id;
          after(async () => {
            try {
              await fetch(`${origin}/api/ai/categorise-error`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-categorisation-secret': secret,
                },
                body: JSON.stringify({
                  attempt_id: attemptId,
                  problem_id: problemId,
                  subject_id: subjectId,
                  user_id: user.id,
                }),
              });
            } catch (err) {
              console.error('[categorise-trigger] fetch failed:', err);
            }
          });
        }
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
