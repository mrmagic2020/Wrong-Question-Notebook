import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { ERROR_MESSAGES, SPACED_REPETITION_CONSTANTS } from '@/lib/constants';
import { StartSpacedSessionDto } from '@/lib/schemas';

async function checkActiveSession(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subject_id');

  if (!subjectId || !isValidUuid(subjectId)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid subject ID', 400),
      { status: 400 }
    );
  }

  try {
    const { data: existingSession, error: sessionError } = await supabase
      .from('review_session_state')
      .select('id, session_state')
      .eq('user_id', user.id)
      .eq('session_type', 'spaced_repetition')
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          sessionError.message
        ),
        { status: 500 }
      );
    }

    if (existingSession) {
      const state = existingSession.session_state as {
        problem_ids: string[];
        completed_problem_ids: string[];
        skipped_problem_ids: string[];
      };
      return NextResponse.json(
        createApiSuccessResponse({
          exists: true,
          sessionId: existingSession.id,
          progress: {
            total: state.problem_ids.length,
            completed: state.completed_problem_ids.length,
            skipped: state.skipped_problem_ids.length,
          },
        })
      );
    }

    return NextResponse.json(createApiSuccessResponse({ exists: false }));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

async function startSpacedSession(req: Request) {
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

  const parsed = StartSpacedSessionDto.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      createApiErrorResponse('Invalid request body', 400, parsed.error.flatten()),
      { status: 400 }
    );
  }

  const { subject_id, session_size } = parsed.data;

  const effectiveSize = Math.min(
    session_size ?? SPACED_REPETITION_CONSTANTS.DEFAULT_SESSION_SIZE,
    SPACED_REPETITION_CONSTANTS.MAX_SESSION_SIZE
  );

  try {
    // Check for existing active SR session for this subject
    const { data: existingSession, error: lookupError } = await supabase
      .from('review_session_state')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_type', 'spaced_repetition')
      .eq('subject_id', subject_id)
      .eq('is_active', true)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          lookupError.message
        ),
        { status: 500 }
      );
    }

    if (existingSession) {
      return NextResponse.json(
        createApiSuccessResponse({
          sessionId: existingSession.id,
          resumed: true,
        })
      );
    }

    // Query due problems via RPC
    const { data: dueProblems, error: rpcError } = await supabase.rpc(
      'get_due_problems_for_subject',
      { p_subject_id: subject_id, p_limit: effectiveSize }
    );

    if (rpcError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          rpcError.message
        ),
        { status: 500 }
      );
    }

    if (!dueProblems || dueProblems.length === 0) {
      return NextResponse.json(
        createApiErrorResponse('No problems due for review', 404),
        { status: 404 }
      );
    }

    const selectedIds = dueProblems.map((p: any) => p.id);

    // Build initial statuses
    const initialStatuses: Record<string, string> = {};
    for (const p of dueProblems) {
      initialStatuses[p.id] = p.status;
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('review_session_state')
      .insert({
        user_id: user.id,
        session_type: 'spaced_repetition',
        subject_id,
        problem_set_id: null,
        session_state: {
          problem_ids: selectedIds,
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
        problemCount: selectedIds.length,
        firstProblemId: selectedIds[0],
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

export const GET = withSecurity(checkActiveSession, {
  rateLimitType: 'api',
});

export const POST = withSecurity(startSpacedSession, {
  rateLimitType: 'api',
});
