import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id: problemId } = await params;

  if (!problemId) {
    return NextResponse.json(
      createApiErrorResponse('Problem ID is required', 400),
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

  const { assets, solution_assets } = body;

  // Validate that at least one asset array is provided
  if (assets === undefined && solution_assets === undefined) {
    return NextResponse.json(
      createApiErrorResponse(
        'Either assets or solution_assets must be provided',
        400
      ),
      { status: 400 }
    );
  }

  try {
    // Update only the provided asset columns
    const updateData: Partial<{
      assets: Array<{ path: string }>;
      solution_assets: Array<{ path: string }>;
    }> = {};
    if (assets !== undefined) {
      updateData.assets = assets;
    }
    if (solution_assets !== undefined) {
      updateData.solution_assets = solution_assets;
    }

    const { data: updated, error } = await supabase
      .from('problems')
      .update(updateData)
      .eq('id', problemId)
      .eq('user_id', user.id)
      .select('assets, solution_assets')
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

    return NextResponse.json(
      createApiSuccessResponse({
        assets: updated.assets,
        solution_assets: updated.solution_assets,
      })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}
