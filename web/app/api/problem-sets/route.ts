import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { CreateProblemSetDto } from '@/lib/schemas';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import { revalidateUserProblemSets } from '@/lib/cache-invalidation';

// Cache configuration for this route
export const revalidate = 300; // 5 minutes

async function getProblemSets(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subject_id');

  // Validate UUID format for subjectId
  if (subjectId && !isValidUuid(subjectId)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid subject ID format', 400),
      { status: 400 }
    );
  }

  try {
    let query = supabase
      .from('problem_sets')
      .select(
        `
        *,
        problem_set_problems(count),
        subjects(name)
      `
      )
      .eq('user_id', user.id);

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

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

    // Transform the data to include problem count
    const problemSetsWithCount = (data || []).map(problemSet => ({
      ...problemSet,
      problem_count: problemSet.problem_set_problems?.[0]?.count || 0,
      subject_name: problemSet.subjects?.name,
    }));

    return NextResponse.json(createApiSuccessResponse(problemSetsWithCount));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

async function createProblemSet(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

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
  const parsed = CreateProblemSetDto.safeParse(body);
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

  const { problem_ids, shared_with_emails, ...problemSetData } = parsed.data;

  // Validate that all problem IDs are valid UUIDs
  if (problem_ids && problem_ids.length > 0) {
    for (const problemId of problem_ids) {
      if (!isValidUuid(problemId)) {
        return NextResponse.json(
          createApiErrorResponse('Invalid problem ID format', 400),
          { status: 400 }
        );
      }
    }
  }

  try {
    // Create the problem set (exclude problem_ids and shared_with_emails from the insert)
    const { subject_id, name, description, sharing_level } = problemSetData;

    const { data: createdProblemSet, error: problemSetError } = await supabase
      .from('problem_sets')
      .insert({
        subject_id,
        name,
        description,
        sharing_level,
        user_id: user.id,
      })
      .select()
      .single();

    if (problemSetError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          problemSetError.message
        ),
        { status: 500 }
      );
    }

    // Add problems to the set if provided
    if (problem_ids && problem_ids.length > 0) {
      const problemSetProblems = problem_ids.map((problemId: string) => ({
        problem_set_id: createdProblemSet.id,
        problem_id: problemId,
        user_id: user.id,
      }));

      const { error: problemsError } = await supabase
        .from('problem_set_problems')
        .insert(problemSetProblems);

      if (problemsError) {
        // Clean up the created problem set if adding problems fails
        await supabase
          .from('problem_sets')
          .delete()
          .eq('id', createdProblemSet.id)
          .eq('user_id', user.id);

        return NextResponse.json(
          createApiErrorResponse(
            'Failed to add problems to set',
            500,
            problemsError.message
          ),
          { status: 500 }
        );
      }
    }

    // Add shared emails if provided and sharing level is limited
    if (
      problemSetData.sharing_level === 'limited' &&
      shared_with_emails &&
      shared_with_emails.length > 0
    ) {
      const shares = shared_with_emails.map((email: string) => ({
        problem_set_id: createdProblemSet.id,
        shared_with_email: email,
        shared_by_user_id: user.id,
      }));

      const { error: sharesError } = await supabase
        .from('problem_set_shares')
        .insert(shares);

      if (sharesError) {
        console.error('Failed to add shares:', sharesError);
        // Don't fail the entire operation for share errors
      }
    }

    // Get the created problem set with related data
    const { data: fullProblemSet, error: fetchError } = await supabase
      .from('problem_sets')
      .select(
        `
        *,
        problem_set_problems(count),
        subjects(name)
      `
      )
      .eq('id', createdProblemSet.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json(createApiSuccessResponse(createdProblemSet), {
        status: 201,
      });
    }

    const result = {
      ...fullProblemSet,
      problem_count: fullProblemSet.problem_set_problems?.[0]?.count || 0,
      subject_name: fullProblemSet.subjects?.name,
    };

    // Invalidate cache after successful creation
    await revalidateUserProblemSets(user.id);

    return NextResponse.json(createApiSuccessResponse(result), { status: 201 });
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getProblemSets, { rateLimitType: 'readOnly' });
export const POST = withSecurity(createProblemSet, { rateLimitType: 'api' });
