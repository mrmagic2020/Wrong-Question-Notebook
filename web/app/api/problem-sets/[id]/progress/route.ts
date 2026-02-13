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
import { getFilteredProblems } from '@/lib/review-utils';
import { FilterConfig } from '@/lib/types';

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
    // Fetch the problem set to check access and determine if smart
    const { data: problemSet, error: psError } = await supabase
      .from('problem_sets')
      .select('id, user_id, sharing_level, is_smart, filter_config, subject_id')
      .eq('id', id)
      .single();

    if (psError || !problemSet) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found or access denied', 404),
        { status: 404 }
      );
    }

    // Basic ownership check (smart sets are always private/owned)
    if (
      problemSet.user_id !== user.id &&
      problemSet.sharing_level === 'private'
    ) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found or access denied', 404),
        { status: 404 }
      );
    }

    let problems: { status: string }[];

    if (problemSet.is_smart && problemSet.filter_config) {
      // Smart set: query problems via filter
      const filterConfig: FilterConfig = {
        tag_ids: problemSet.filter_config.tag_ids ?? [],
        statuses: problemSet.filter_config.statuses ?? [],
        problem_types: problemSet.filter_config.problem_types ?? [],
        days_since_review: problemSet.filter_config.days_since_review ?? null,
        include_never_reviewed:
          problemSet.filter_config.include_never_reviewed ?? true,
      };
      const filtered = await getFilteredProblems(
        supabase,
        user.id,
        problemSet.subject_id,
        filterConfig
      );
      problems = filtered.map(p => ({ status: p.status }));
    } else {
      // Manual set: query via junction table
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

      problems =
        (problemSetProblems?.map((p: any) => p.problems).filter(Boolean) as {
          status: string;
        }[]) || [];
    }

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
