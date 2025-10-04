import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { UpdateProblemSetDto } from '@/lib/schemas';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';

async function getProblemSet(
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
    // Get the problem set with problems and their details
    const { data: problemSet, error: problemSetError } = await supabase
      .from('problem_sets')
      .select(
        `
        *,
        subjects(name),
        problem_set_problems(
          problem_id,
          added_at,
          problems(
            id,
            title,
            content,
            problem_type,
            status,
            last_reviewed_date,
            created_at,
            problem_tag(tags:tag_id(id, name))
          )
        ),
        problem_set_shares(
          id,
          shared_with_email
        )
      `
      )
      .eq('id', id)
      .single();

    if (problemSetError) {
      if (problemSetError.code === 'PGRST116') {
        return NextResponse.json(
          createApiErrorResponse('Problem set not found', 404),
          { status: 404 }
        );
      }
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          problemSetError.message
        ),
        { status: 500 }
      );
    }

    // Check if user has access to this problem set
    const isOwner = problemSet.user_id === user.id;
    const isPublic = problemSet.sharing_level === 'public';
    const isLimited = problemSet.sharing_level === 'limited';

    let hasAccess = isOwner || isPublic;

    if (isLimited) {
      try {
        hasAccess = await checkLimitedAccess(supabase, id, user.email || '');
      } catch (error) {
        console.error('Error checking limited access:', error);
        hasAccess = false;
      }
    }

    if (!hasAccess) {
      return NextResponse.json(createApiErrorResponse('Access denied', 403), {
        status: 403,
      });
    }

    // Transform the data to include problems with tags
    const problems =
      problemSet.problem_set_problems
        ?.map((psp: any) => {
          const problem = psp.problems;
          if (!problem) {
            console.warn(
              'Problem not found for problem_set_problem:',
              psp.problem_id
            );
            return null;
          }
          const tags =
            problem?.problem_tag?.map((pt: any) => pt.tags).filter(Boolean) ||
            [];
          return {
            ...problem,
            tags,
            added_at: psp.added_at,
          };
        })
        .filter(Boolean) || [];

    // Transform shared emails
    const shared_with_emails =
      problemSet.problem_set_shares?.map(
        (share: any) => share.shared_with_email
      ) || [];

    const result = {
      ...problemSet,
      subject_name: problemSet.subjects?.name,
      problems,
      problem_count: problems.length,
      shared_with_emails,
    };

    return NextResponse.json(createApiSuccessResponse(result));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

async function updateProblemSet(
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
  const parsed = UpdateProblemSetDto.safeParse(body);
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

  const { shared_with_emails, ...updateData } = parsed.data;

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

    // Update the problem set
    const { data: updatedSet, error: updateError } = await supabase
      .from('problem_sets')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          updateError.message
        ),
        { status: 500 }
      );
    }

    // Handle shared emails based on sharing level
    if (updateData.sharing_level === 'limited') {
      // Remove existing shares first
      await supabase
        .from('problem_set_shares')
        .delete()
        .eq('problem_set_id', id)
        .eq('shared_by_user_id', user.id);

      // Add new shares if any
      if (shared_with_emails && shared_with_emails.length > 0) {
        const shares = shared_with_emails.map(email => ({
          problem_set_id: id,
          shared_with_email: email,
          shared_by_user_id: user.id,
        }));

        const { error: sharesError } = await supabase
          .from('problem_set_shares')
          .insert(shares);

        if (sharesError) {
          console.error('Failed to update shares:', sharesError);
          // Don't fail the entire operation for share errors
        }
      }
    } else {
      // For private and public, remove all existing shares
      await supabase
        .from('problem_set_shares')
        .delete()
        .eq('problem_set_id', id)
        .eq('shared_by_user_id', user.id);
    }

    return NextResponse.json(createApiSuccessResponse(updatedSet));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

async function deleteProblemSet(
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

    // Delete the problem set (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('problem_sets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          deleteError.message
        ),
        { status: 500 }
      );
    }

    return NextResponse.json(createApiSuccessResponse({ id }));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

// Helper function to check limited access
async function checkLimitedAccess(
  supabase: any,
  problemSetId: string,
  userEmail: string
): Promise<boolean> {
  const { data: share } = await supabase
    .from('problem_set_shares')
    .select('id')
    .eq('problem_set_id', problemSetId)
    .eq('shared_with_email', userEmail)
    .single();

  return !!share;
}

export const GET = withSecurity(getProblemSet, { rateLimitType: 'readOnly' });
export const PUT = withSecurity(updateProblemSet, { rateLimitType: 'api' });
export const DELETE = withSecurity(deleteProblemSet, { rateLimitType: 'api' });
