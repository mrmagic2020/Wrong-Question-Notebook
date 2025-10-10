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
import { getProblemSetBasic } from '@/lib/problem-set-utils';

// Cache configuration for this route
export const revalidate = 300; // 5 minutes

async function getProblemSetProgress(
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
    // Check if user has access to this problem set
    const problemSet = await getProblemSetBasic(
      supabase,
      id,
      user.id,
      user.email || ''
    );

    if (!problemSet) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found or access denied', 404),
        { status: 404 }
      );
    }

    // Get progress by querying the problems directly instead of using the database function
    const { data: problemSetProblems, error: problemsError } = await supabase
      .from('problem_set_problems')
      .select(
        `
        problems(
          status
        )
      `
      )
      .eq('problem_set_id', id);

    if (problemsError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          problemsError.message
        ),
        { status: 500 }
      );
    }

    const problems =
      problemSetProblems?.map(p => p.problems).filter(Boolean) || [];

    const progress = {
      total_problems: problems.length,
      wrong_count: problems.filter((p: any) => p.status === 'wrong').length,
      needs_review_count: problems.filter(
        (p: any) => p.status === 'needs_review'
      ).length,
      mastered_count: problems.filter((p: any) => p.status === 'mastered')
        .length,
    };

    return NextResponse.json(createApiSuccessResponse(progress));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getProblemSetProgress, {
  rateLimitType: 'readOnly',
});
