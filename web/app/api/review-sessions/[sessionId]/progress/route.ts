import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';

async function updateProgress(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { sessionId } = await params;

  if (!isValidUuid(sessionId)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid session ID format', 400),
      { status: 400 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      createApiErrorResponse('Invalid request body', 400),
      { status: 400 }
    );
  }

  const { problemId, wasCorrect, wasSkipped, currentIndex, elapsed_ms } = body;

  if (!problemId || !isValidUuid(problemId)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid problem ID', 400),
      { status: 400 }
    );
  }

  try {
    // Get current session
    const { data: session, error: sessionError } = await supabase
      .from('review_session_state')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        createApiErrorResponse('Active session not found', 404),
        { status: 404 }
      );
    }

    // Update session state
    const sessionState = { ...session.session_state };
    if (typeof currentIndex === 'number') {
      sessionState.current_index = currentIndex;
    }

    if (typeof elapsed_ms === 'number') {
      sessionState.elapsed_ms = elapsed_ms;
    }

    // Determine the action type:
    // - wasSkipped=true → skip
    // - wasSkipped=false AND wasCorrect is a boolean → answer (completed)
    // - otherwise → heartbeat (save position/timer only, no completion tracking)
    const isAnswer = !wasSkipped && typeof wasCorrect === 'boolean';

    if (wasSkipped) {
      if (!sessionState.skipped_problem_ids.includes(problemId)) {
        sessionState.skipped_problem_ids = [
          ...sessionState.skipped_problem_ids,
          problemId,
        ];
      }
    } else if (isAnswer) {
      if (!sessionState.completed_problem_ids.includes(problemId)) {
        sessionState.completed_problem_ids = [
          ...sessionState.completed_problem_ids,
          problemId,
        ];
      }
      // Remove from skipped if it was previously skipped and now completed
      sessionState.skipped_problem_ids =
        sessionState.skipped_problem_ids.filter(
          (id: string) => id !== problemId
        );
    }

    // Update session in database
    const { data: updatedSession, error: updateError } = await supabase
      .from('review_session_state')
      .update({
        session_state: sessionState,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          updateError.message
        ),
        { status: 500 }
      );
    }

    // Only create result entries and update last_reviewed_date for actual
    // answers or skips — not for heartbeat/save-state-only requests.
    if (wasSkipped || isAnswer) {
      const { error: resultError } = await supabase
        .from('review_session_results')
        .insert({
          session_state_id: sessionId,
          problem_id: problemId,
          was_correct: wasCorrect ?? null,
          was_skipped: wasSkipped || false,
        });

      if (resultError) {
        console.error('Failed to create session result:', resultError);
      }
    }

    // Update problem's last_reviewed_date only when actually answered
    if (isAnswer) {
      await supabase
        .from('problems')
        .update({ last_reviewed_date: new Date().toISOString() })
        .eq('id', problemId)
        .eq('user_id', user.id);
    }

    return NextResponse.json(
      createApiSuccessResponse({ session: updatedSession })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const PATCH = withSecurity(updateProgress, { rateLimitType: 'api' });
