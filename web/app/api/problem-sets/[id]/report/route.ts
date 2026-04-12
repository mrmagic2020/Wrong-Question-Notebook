import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { createServiceClient } from '@/lib/supabase-utils';
import { checkProblemSetAccess } from '@/lib/problem-set-utils';
import { PROBLEM_SET_CONSTANTS, RATE_LIMIT_CONSTANTS } from '@/lib/constants';
import { z } from 'zod';

const ReportBody = z.object({
  reason: z
    .string()
    .refine(
      val =>
        (PROBLEM_SET_CONSTANTS.REPORT_REASONS as readonly string[]).includes(
          val
        ),
      { message: 'Invalid report reason' }
    ),
  details: z.string().max(1000).optional(),
});

async function reportProblemSet(
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

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      createApiErrorResponse('Invalid request body', 400),
      { status: 400 }
    );
  }

  const parsed = ReportBody.safeParse(body);
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
    // Verify the problem set exists and user has access
    const serviceClient = createServiceClient();
    const { data: problemSet } = await serviceClient
      .from('problem_sets')
      .select('user_id, sharing_level')
      .eq('id', id)
      .single();

    if (!problemSet) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found', 404),
        { status: 404 }
      );
    }

    const hasAccess = await checkProblemSetAccess(
      serviceClient,
      problemSet,
      user.id,
      user.email || null,
      id
    );

    if (!hasAccess) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found', 404),
        { status: 404 }
      );
    }

    const { error } = await supabase.from('problem_set_reports').insert({
      problem_set_id: id,
      reporter_user_id: user.id,
      reason: parsed.data.reason,
      details: parsed.data.details || null,
    });

    if (error) {
      // Unique constraint violation = already reported
      if (error.code === '23505') {
        return NextResponse.json(
          createApiErrorResponse(
            'You have already reported this problem set',
            409
          ),
          { status: 409 }
        );
      }
      return NextResponse.json(
        createApiErrorResponse('Failed to submit report', 500, error.message),
        { status: 500 }
      );
    }

    return NextResponse.json(createApiSuccessResponse({ reported: true }), {
      status: 201,
    });
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(reportProblemSet, {
  rateLimitType: 'custom',
  customRateLimit: {
    windowMs: RATE_LIMIT_CONSTANTS.WINDOWS.ONE_HOUR,
    maxRequests: 10,
  },
});
