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
import { getProblemSetWithFullData } from '@/lib/problem-set-utils';
import {
  revalidateUserProblemSets,
  revalidateProblemSet,
} from '@/lib/cache-invalidation';

// Cache configuration for this route
export const revalidate = 300; // 5 minutes

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
    const problemSet = await getProblemSetWithFullData(
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

    return NextResponse.json(createApiSuccessResponse(problemSet));
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

  // Only include fields that were explicitly provided in the request body.
  // Zod v4 .partial() preserves .default() values, so fields like is_smart
  // and sharing_level get defaulted even when not sent. We use the raw body
  // keys to determine what was actually provided.
  const providedKeys = new Set(Object.keys(body));
  const fullUpdateData: Record<string, unknown> = {};
  const nonColumnKeys = new Set(['shared_with_emails', 'problem_ids']);
  for (const key of Object.keys(parsed.data)) {
    if (providedKeys.has(key) && !nonColumnKeys.has(key)) {
      fullUpdateData[key] = (parsed.data as Record<string, unknown>)[key];
    }
  }
  const shared_with_emails = parsed.data.shared_with_emails;

  // When setting is_smart to true, require filter_config to be present
  if (providedKeys.has('is_smart') && fullUpdateData.is_smart) {
    const hasFilterConfig =
      providedKeys.has('filter_config') && fullUpdateData.filter_config != null;
    if (!hasFilterConfig) {
      return NextResponse.json(
        createApiErrorResponse(
          'Smart problem sets must include a valid filter_config',
          400
        ),
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

    // Update the problem set
    const { data: updatedSet, error: updateError } = await supabase
      .from('problem_sets')
      .update(fullUpdateData)
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

    // Handle shared emails only when sharing_level was explicitly provided
    if (providedKeys.has('sharing_level')) {
      if (fullUpdateData.sharing_level === 'limited') {
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
    }

    // Invalidate cache after successful update
    await Promise.all([
      revalidateUserProblemSets(user.id),
      revalidateProblemSet(id),
    ]);

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

    // Invalidate cache after successful deletion
    await Promise.all([
      revalidateUserProblemSets(user.id),
      revalidateProblemSet(id),
    ]);

    return NextResponse.json(createApiSuccessResponse({ id }));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getProblemSet, { rateLimitType: 'readOnly' });
export const PUT = withSecurity(updateProblemSet, { rateLimitType: 'api' });
export const DELETE = withSecurity(deleteProblemSet, { rateLimitType: 'api' });
