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
    const isReadOnly = !!session.session_state?.is_read_only;
    const problemIds = session.session_state?.problem_ids || [];
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
