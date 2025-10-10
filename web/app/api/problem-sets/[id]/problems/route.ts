import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { AddProblemsToSetDto, RemoveProblemsFromSetDto } from '@/lib/schemas';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import {
  revalidateUserProblemSets,
  revalidateProblemSet,
} from '@/lib/cache-invalidation';

// Cache configuration for this route
export const revalidate = 300; // 5 minutes

async function getProblemSetProblems(
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
    // Check if user owns this problem set
    const { data: existingSet, error: checkError } = await supabase
      .from('problem_sets')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingSet) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found or access denied', 404),
        { status: 404 }
      );
    }

    // Get problems in this set
    const { data: problemSetProblems, error: problemsError } = await supabase
      .from('problem_set_problems')
      .select(
        `
        problem_id,
        added_at,
        problems(
          id,
          title,
          content,
          problem_type,
          status,
          last_reviewed_date,
          created_at
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

    return NextResponse.json(
      createApiSuccessResponse(problemSetProblems || [])
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

async function addProblemsToSet(
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
  } catch (error) {
    return NextResponse.json(
      createApiErrorResponse(
        ERROR_MESSAGES.INVALID_REQUEST,
        400,
        error as string
      ),
      { status: 400 }
    );
  }

  // Validate request body using Zod schema
  const parsed = AddProblemsToSetDto.safeParse(body);
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

  const { problem_ids } = parsed.data;

  if (!problem_ids || problem_ids.length === 0) {
    return NextResponse.json(
      createApiErrorResponse('No problems provided', 400),
      { status: 400 }
    );
  }

  // Validate that all problem IDs are valid UUIDs
  for (const problemId of problem_ids) {
    if (!isValidUuid(problemId)) {
      return NextResponse.json(
        createApiErrorResponse('Invalid problem ID format', 400),
        { status: 400 }
      );
    }
  }

  try {
    // Check if user owns this problem set
    const { data: existingSet, error: checkError } = await supabase
      .from('problem_sets')
      .select('id, user_id, subject_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingSet) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found or access denied', 404),
        { status: 404 }
      );
    }

    // Verify that all problems belong to the same subject as the problem set
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('id, subject_id')
      .in('id', problem_ids)
      .eq('user_id', user.id);

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

    // Check if all problems belong to the same subject
    const invalidProblems =
      problems?.filter(p => p.subject_id !== existingSet.subject_id) || [];
    if (invalidProblems.length > 0) {
      return NextResponse.json(
        createApiErrorResponse(
          'All problems must belong to the same subject as the problem set',
          400
        ),
        { status: 400 }
      );
    }

    // Check if problems are already in the set
    const { data: existingProblems, error: existingError } = await supabase
      .from('problem_set_problems')
      .select('problem_id')
      .eq('problem_set_id', id)
      .in('problem_id', problem_ids);

    if (existingError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          existingError.message
        ),
        { status: 500 }
      );
    }

    const existingProblemIds = existingProblems?.map(p => p.problem_id) || [];
    const newProblemIds = problem_ids.filter(
      id => !existingProblemIds.includes(id)
    );

    if (newProblemIds.length === 0) {
      return NextResponse.json(
        createApiErrorResponse(
          'All selected problems are already in the set',
          400
        ),
        { status: 400 }
      );
    }

    // Add new problems to the set
    const problemSetProblems = newProblemIds.map(problemId => ({
      problem_set_id: id,
      problem_id: problemId,
      user_id: user.id,
    }));

    const { error: insertError } = await supabase
      .from('problem_set_problems')
      .insert(problemSetProblems);

    if (insertError) {
      return NextResponse.json(
        createApiErrorResponse(
          'Failed to add problems to set',
          500,
          insertError.message
        ),
        { status: 500 }
      );
    }

    // Invalidate cache after successful addition
    await Promise.all([
      revalidateUserProblemSets(user.id),
      revalidateProblemSet(id),
    ]);

    return NextResponse.json(
      createApiSuccessResponse({
        added_count: newProblemIds.length,
        skipped_count: existingProblemIds.length,
        added_problem_ids: newProblemIds,
      })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

async function removeProblemsFromSet(
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
  } catch (error) {
    return NextResponse.json(
      createApiErrorResponse(
        ERROR_MESSAGES.INVALID_REQUEST,
        400,
        error as string
      ),
      { status: 400 }
    );
  }

  // Validate request body using Zod schema
  const parsed = RemoveProblemsFromSetDto.safeParse(body);
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

  const { problem_ids } = parsed.data;

  if (!problem_ids || problem_ids.length === 0) {
    return NextResponse.json(
      createApiErrorResponse('No problems provided', 400),
      { status: 400 }
    );
  }

  // Validate that all problem IDs are valid UUIDs
  for (const problemId of problem_ids) {
    if (!isValidUuid(problemId)) {
      return NextResponse.json(
        createApiErrorResponse('Invalid problem ID format', 400),
        { status: 400 }
      );
    }
  }

  try {
    // Check if user owns this problem set
    const { data: existingSet, error: checkError } = await supabase
      .from('problem_sets')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingSet) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found or access denied', 404),
        { status: 404 }
      );
    }

    // Remove problems from the set
    const { error: deleteError } = await supabase
      .from('problem_set_problems')
      .delete()
      .eq('problem_set_id', id)
      .eq('user_id', user.id)
      .in('problem_id', problem_ids);

    if (deleteError) {
      return NextResponse.json(
        createApiErrorResponse(
          'Failed to remove problems from set',
          500,
          deleteError.message
        ),
        { status: 500 }
      );
    }

    // Invalidate cache after successful removal
    await Promise.all([
      revalidateUserProblemSets(user.id),
      revalidateProblemSet(id),
    ]);

    return NextResponse.json(
      createApiSuccessResponse({
        removed_count: problem_ids.length,
        removed_problem_ids: problem_ids,
      })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getProblemSetProblems, {
  rateLimitType: 'api',
});
export const POST = withSecurity(addProblemsToSet, { rateLimitType: 'api' });
export const DELETE = withSecurity(removeProblemsFromSet, {
  rateLimitType: 'api',
});
