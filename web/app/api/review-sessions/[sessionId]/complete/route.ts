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
import { calculateSessionStats } from '@/lib/review-utils';
import { createServiceClient } from '@/lib/supabase-utils';

async function completeSession(
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
    // Mark session as complete
    const { data: session, error: updateError } = await supabase
      .from('review_session_state')
      .update({
        is_active: false,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !session) {
      return NextResponse.json(
        createApiErrorResponse(
          session ? ERROR_MESSAGES.DATABASE_ERROR : 'Session not found',
          session ? 500 : 404,
          updateError?.message
        ),
        { status: session ? 500 : 404 }
      );
    }

    // Fetch current problem statuses for delta calculation
    // For read-only sessions, use service client since problems belong to owner
    const isReadOnly = !!session.session_state?.is_read_only;
    const problemIds = session.session_state?.problem_ids || [];
    const currentStatuses: Record<string, string> = {};
    if (problemIds.length > 0) {
      const queryClient = isReadOnly ? createServiceClient() : supabase;
      const { data: problems } = await queryClient
        .from('problems')
        .select('id, status')
        .in('id', problemIds);

      for (const p of problems || []) {
        currentStatuses[p.id] = p.status;
      }
    }

    const summary = calculateSessionStats(session, currentStatuses);

    return NextResponse.json(
      createApiSuccessResponse({
        session,
        summary,
      })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(completeSession, { rateLimitType: 'api' });
