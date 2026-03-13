import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import { StartInsightsReviewDto } from '@/lib/schemas';

async function startInsightsSession(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      createApiErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400),
      { status: 400 }
    );
  }

  const parsed = StartInsightsReviewDto.safeParse(body);
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

  const { subject_id, problem_ids } = parsed.data;

  try {
    // Check for an existing active insights_review session with the same problems
    const { data: activeSessions } = await supabase
      .from('review_session_state')
      .select('id, session_state')
      .eq('user_id', user.id)
      .eq('session_type', 'insights_review')
      .eq('subject_id', subject_id)
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false });

    if (activeSessions && activeSessions.length > 0) {
      const sortedRequestIds = [...problem_ids].sort().join(',');
      const match = activeSessions.find(s => {
        const sessionIds = [
          ...((s.session_state as { problem_ids?: string[] })?.problem_ids ??
            []),
        ]
          .sort()
          .join(',');
        return sessionIds === sortedRequestIds;
      });

      if (match) {
        return NextResponse.json(
          createApiSuccessResponse({
            sessionId: match.id,
            problemCount: problem_ids.length,
            firstProblemId: problem_ids[0],
            resumed: true,
          })
        );
      }
    }

    // Validate the user owns all the problems and they belong to the subject
    const { data: ownedProblems, error: ownershipError } = await supabase
      .from('problems')
      .select('id, status')
      .in('id', problem_ids)
      .eq('user_id', user.id)
      .eq('subject_id', subject_id);

    if (ownershipError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          ownershipError.message
        ),
        { status: 500 }
      );
    }

    if (!ownedProblems || ownedProblems.length !== problem_ids.length) {
      return NextResponse.json(
        createApiErrorResponse(
          'You do not own all the specified problems',
          403
        ),
        { status: 403 }
      );
    }

    // Build initial statuses map
    const initialStatuses: Record<string, string> = {};
    for (const p of ownedProblems) {
      initialStatuses[p.id] = p.status;
    }

    // Create review session
    const { data: session, error: sessionError } = await supabase
      .from('review_session_state')
      .insert({
        user_id: user.id,
        session_type: 'insights_review',
        subject_id,
        problem_set_id: null,
        session_state: {
          problem_ids,
          current_index: 0,
          completed_problem_ids: [],
          skipped_problem_ids: [],
          initial_statuses: initialStatuses,
          elapsed_ms: 0,
        },
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          sessionError?.message
        ),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createApiSuccessResponse({
        sessionId: session.id,
        problemCount: problem_ids.length,
        firstProblemId: problem_ids[0],
      }),
      { status: 201 }
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(startInsightsSession, {
  rateLimitType: 'api',
});
