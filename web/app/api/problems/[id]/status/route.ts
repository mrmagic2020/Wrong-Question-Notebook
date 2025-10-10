import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import { PROBLEM_STATUS_VALUES } from '@/lib/schemas';
import { revalidateProblemAndSubject } from '@/lib/cache-invalidation';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id: problemId } = await params;
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

  // Validate the request body
  const { status, last_reviewed_date } = body;

  if (!status && !last_reviewed_date) {
    return NextResponse.json(
      createApiErrorResponse(
        'Either status or last_reviewed_date must be provided',
        400
      ),
      { status: 400 }
    );
  }

  if (status && !PROBLEM_STATUS_VALUES.includes(status as any)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid status value', 400),
      { status: 400 }
    );
  }

  // Build update object with only provided fields
  const updateData: any = {};
  if (status !== undefined) {
    updateData.status = status;
  }
  if (last_reviewed_date !== undefined) {
    updateData.last_reviewed_date = last_reviewed_date;
  }

  try {
    // Update only the status and/or last_reviewed_date fields
    const { data, error } = await supabase
      .from('problems')
      .update(updateData)
      .eq('id', problemId)
      .eq('user_id', user.id)
      .select('*, subject_id')
      .single();

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

    if (!data) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
        { status: 404 }
      );
    }

    // Invalidate cache after successful status update - only the specific problem and its subject
    await revalidateProblemAndSubject(problemId, data.subject_id);

    return NextResponse.json(createApiSuccessResponse(data));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}
