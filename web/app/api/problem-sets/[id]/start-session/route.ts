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
import { getFilteredProblems, applySessionConfig } from '@/lib/review-utils';
import { SessionConfig } from '@/lib/types';
import { checkProblemSetAccess } from '@/lib/problem-set-utils';
import { createServiceClient } from '@/lib/supabase-utils';

async function startSession(
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
    // Fetch problem set without owner restriction
    const { data: problemSet, error: psError } = await supabase
      .from('problem_sets')
      .select('*')
      .eq('id', id)
      .single();

    if (psError || !problemSet) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found or access denied', 404),
        { status: 404 }
      );
    }

    // Check access (owner, public, or limited)
    const isOwner = problemSet.user_id === user.id;
    const hasAccess = await checkProblemSetAccess(
      supabase,
      problemSet,
      user.id,
      user.email || '',
      id
    );

    if (!hasAccess) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found or access denied', 404),
        { status: 404 }
      );
    }

    // Check for existing active session
    const { data: existingSession } = await supabase
      .from('review_session_state')
      .select('id, session_state, started_at, last_activity_at')
      .eq('problem_set_id', id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (existingSession) {
      return NextResponse.json(
        createApiSuccessResponse({
          hasActiveSession: true,
          sessionId: existingSession.id,
          session: existingSession,
        })
      );
    }

    // Use owner's ID for problem filtering
    const ownerUserId = problemSet.user_id;

    // Get problems for this session
    let problems;
    if (problemSet.is_smart) {
      if (!problemSet.filter_config) {
        return NextResponse.json(
          createApiErrorResponse(
            'Smart problem set is missing filter configuration',
            400
          ),
          { status: 400 }
        );
      }
      const filterConfig = {
        ...problemSet.filter_config,
        tag_ids: problemSet.filter_config.tag_ids ?? [],
        statuses: problemSet.filter_config.statuses ?? [],
        problem_types: problemSet.filter_config.problem_types ?? [],
        days_since_review: problemSet.filter_config.days_since_review ?? null,
        include_never_reviewed:
          problemSet.filter_config.include_never_reviewed ?? true,
      };
      // For shared smart sets, use service client to bypass RLS
      const queryClient = isOwner ? supabase : createServiceClient();
      problems = await getFilteredProblems(
        queryClient,
        ownerUserId,
        problemSet.subject_id,
        filterConfig,
        ownerUserId
      );
    } else {
      // Manual set: get problems from problem_set_problems
      const { data: pspData } = await supabase
        .from('problem_set_problems')
        .select('problem_id, problems(id, status)')
        .eq('problem_set_id', id);

      problems = (pspData || [])
        .map((psp: any) => psp.problems)
        .filter(Boolean);
    }

    if (problems.length === 0) {
      return NextResponse.json(
        createApiErrorResponse('No problems match the current filters', 400),
        { status: 400 }
      );
    }

    // Apply session config (randomize, limit)
    const sessionConfig: SessionConfig = problemSet.session_config || {
      randomize: true,
      session_size: null,
      auto_advance: false,
    };

    const sessionProblems = applySessionConfig(problems, sessionConfig);
    const problemIds = sessionProblems.map(p => p.id);

    // Capture initial statuses for delta calculation in summary
    const initialStatuses: Record<string, string> = {};
    for (const p of sessionProblems) {
      initialStatuses[p.id] = p.status;
    }

    // Create new session (mark non-owner sessions as read-only)
    const { data: newSession, error: sessionError } = await supabase
      .from('review_session_state')
      .insert({
        user_id: user.id,
        problem_set_id: id,
        is_active: true,
        session_state: {
          problem_ids: problemIds,
          current_index: 0,
          completed_problem_ids: [],
          skipped_problem_ids: [],
          initial_statuses: initialStatuses,
          elapsed_ms: 0,
          is_read_only: !isOwner,
        },
      })
      .select()
      .single();

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

    return NextResponse.json(
      createApiSuccessResponse({
        hasActiveSession: false,
        sessionId: newSession.id,
        session: newSession,
        firstProblemId: problemIds[0],
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

export const POST = withSecurity(startSession, { rateLimitType: 'api' });
