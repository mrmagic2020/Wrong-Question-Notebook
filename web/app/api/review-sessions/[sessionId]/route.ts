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
import type { ReviewSessionState } from '@/lib/types';
import type { Json } from '@/lib/database.types';
import { createServiceClient } from '@/lib/supabase-utils';

async function getSession(
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

  try {
    // Get session state
    const { data: session, error: sessionError } = await supabase
      .from('review_session_state')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        createApiErrorResponse('Session not found', 404),
        { status: 404 }
      );
    }

    // Get all problems in this session
    // For read-only sessions (shared sets), use service client to bypass RLS
    // since the problems belong to the set owner, not the viewer
    const sessionState =
      session.session_state as ReviewSessionState['session_state'];
    const isReadOnly = !!sessionState?.is_read_only;
    const problemIds = sessionState?.problem_ids || [];
    let problems: any[] = [];
    if (problemIds.length > 0) {
      const queryClient = isReadOnly ? createServiceClient() : supabase;
      const { data: problemsData } = await queryClient
        .from('problems')
        .select(
          `
          *,
          problem_tag(tags:tag_id(id, name))
        `
        )
        .in('id', problemIds);

      // Transform and order by session order
      const problemMap = new Map(
        (problemsData || []).map(p => {
          const tags =
            p.problem_tag?.map((pt: any) => pt.tags).filter(Boolean) || [];
          return [p.id, { ...p, tags }];
        })
      );
      problems = problemIds
        .map((id: string) => problemMap.get(id))
        .filter(Boolean);

      // Heal session: strip deleted problem IDs from session state
      const foundIds = new Set(problems.map((p: any) => p.id));
      const deletedIds = problemIds.filter((id: string) => !foundIds.has(id));

      if (deletedIds.length > 0) {
        const deletedSet = new Set(deletedIds);
        const healedState = {
          ...(session.session_state as ReviewSessionState['session_state']),
        };
        healedState.problem_ids = problemIds.filter(
          (id: string) => !deletedSet.has(id)
        );
        healedState.completed_problem_ids = (
          healedState.completed_problem_ids || []
        ).filter((id: string) => !deletedSet.has(id));
        healedState.skipped_problem_ids = (
          healedState.skipped_problem_ids || []
        ).filter((id: string) => !deletedSet.has(id));
        if (healedState.initial_statuses) {
          for (const id of deletedIds) {
            delete healedState.initial_statuses[id];
          }
        }
        // Clamp current_index to the new bounds
        if (healedState.problem_ids.length === 0) {
          healedState.current_index = 0;
        } else if (
          healedState.current_index >= healedState.problem_ids.length
        ) {
          healedState.current_index = healedState.problem_ids.length - 1;
        }

        // Persist healed state
        await supabase
          .from('review_session_state')
          .update({ session_state: healedState as Json })
          .eq('id', sessionId);

        session.session_state = healedState as Json;
      }
    }

    // If no problems remain after healing, auto-complete the session
    if (problems.length === 0) {
      await supabase
        .from('review_session_state')
        .update({
          is_active: false,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      return NextResponse.json(
        createApiErrorResponse(
          'All problems in this session have been deleted. The session has been closed.',
          410
        ),
        { status: 410 }
      );
    }

    // Get session results so far
    const { data: results } = await supabase
      .from('review_session_results')
      .select('*')
      .eq('session_state_id', sessionId)
      .order('completed_at', { ascending: true });

    return NextResponse.json(
      createApiSuccessResponse({
        session,
        problems,
        results: results || [],
      })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

async function deleteSession(
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

  try {
    // Mark session as inactive (soft delete)
    const { error } = await supabase
      .from('review_session_state')
      .update({ is_active: false, last_activity_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id);

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

    return NextResponse.json(
      createApiSuccessResponse({ id: sessionId, is_active: false })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getSession, { rateLimitType: 'readOnly' });
export const DELETE = withSecurity(deleteSession, { rateLimitType: 'api' });
