import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { deleteProblemFiles } from '@/lib/storage/delete';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';

async function cleanupProblem(
  req: Request,
  params: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id: problemId } = await params.params;

  if (!problemId) {
    return NextResponse.json(
      createApiErrorResponse('Problem ID is required', 400),
      { status: 400 }
    );
  }

  try {
    // Safety check: verify that this problem does NOT exist in the database
    // This prevents accidental deletion of assets for existing problems
    const { data: existingProblem, error: fetchError } = await supabase
      .from('problems')
      .select('id')
      .eq('id', problemId)
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is what we want
      throw fetchError;
    }

    if (existingProblem) {
      return NextResponse.json(
        createApiErrorResponse(
          'Cannot cleanup assets for existing problem',
          400
        ),
        { status: 400 }
      );
    }

    // Delete all files for this problem ID
    await deleteProblemFiles(supabase, user.id, problemId);

    return NextResponse.json(createApiSuccessResponse({ ok: true }));
  } catch (error) {
    console.error('Failed to cleanup problem assets:', error);
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const DELETE = cleanupProblem;
export const POST = cleanupProblem;
