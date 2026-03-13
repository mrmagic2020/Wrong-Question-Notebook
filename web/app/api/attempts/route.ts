import { NextResponse, after } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { CreateAttemptDto } from '@/lib/schemas';
import { withSecurity } from '@/lib/security-middleware';
import {
  isValidUuid,
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import {
  revalidateProblemAndSubject,
  revalidateUserReviewSchedule,
} from '@/lib/cache-invalidation';
import { updateReviewSchedule } from '@/lib/spaced-repetition';
import { createServiceClient } from '@/lib/supabase-utils';
import { getUserTimezone } from '@/lib/timezone-utils';

async function getAttempts(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { searchParams } = new URL(req.url);
  const problem_id = searchParams.get('problem_id');

  if (!problem_id) {
    return NextResponse.json(
      createApiErrorResponse('problem_id is required', 400),
      { status: 400 }
    );
  }

  // Validate UUID format
  if (!isValidUuid(problem_id)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid problem ID format', 400),
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('problem_id', problem_id)
      .order('created_at', { ascending: false });

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

    return NextResponse.json(createApiSuccessResponse(data));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getAttempts, { rateLimitType: 'readOnly' });

async function createAttempt(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

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

  const parsed = CreateAttemptDto.safeParse(body);
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
    // Get the problem to get subject_id for cache invalidation
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('subject_id')
      .eq('id', parsed.data.problem_id)
      .single();

    if (problemError) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
        { status: 404 }
      );
    }

    const payload = {
      ...parsed.data,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('attempts')
      .insert(payload)
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

    // Sync problem status when selected_status is provided
    if (parsed.data.selected_status) {
      const { error: statusError } = await supabase
        .from('problems')
        .update({
          status: parsed.data.selected_status,
          last_reviewed_date: new Date().toISOString(),
        })
        .eq('id', parsed.data.problem_id)
        .eq('user_id', user.id);

      if (statusError) {
        console.error('Failed to sync problem status:', statusError.message);
      }
    }

    // Invalidate cache after successful attempt creation
    await revalidateProblemAndSubject(
      parsed.data.problem_id,
      problem.subject_id
    );

    // Update spaced repetition schedule
    try {
      const srStatus =
        parsed.data.selected_status ??
        (data.is_correct !== null
          ? data.is_correct
            ? 'mastered'
            : 'wrong'
          : null);

      if (srStatus) {
        const serviceClient = createServiceClient();
        const userTimezone = await getUserTimezone(user.id);
        await updateReviewSchedule(
          serviceClient,
          user.id,
          parsed.data.problem_id,
          srStatus,
          userTimezone
        );
        await revalidateUserReviewSchedule(user.id);
      }
    } catch (e) {
      console.error('Failed to update review schedule:', e);
    }

    // Trigger AI error categorisation after the response is sent
    const triggerStatus =
      parsed.data.selected_status ??
      (data.is_correct === false ? 'wrong' : null);
    if (triggerStatus === 'wrong' || triggerStatus === 'needs_review') {
      const origin = new URL(req.url).origin;
      const secret = process.env.CATEGORISATION_SECRET;
      if (secret) {
        after(async () => {
          try {
            await fetch(`${origin}/api/ai/categorise-error`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-categorisation-secret': secret,
              },
              body: JSON.stringify({
                attempt_id: data.id,
                problem_id: parsed.data.problem_id,
                subject_id: problem.subject_id,
                user_id: user.id,
              }),
            });
          } catch (err) {
            console.error('[categorise-trigger] fetch failed:', err);
          }
        });
      }
    }

    return NextResponse.json(createApiSuccessResponse(data), { status: 201 });
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(createAttempt, { rateLimitType: 'api' });
