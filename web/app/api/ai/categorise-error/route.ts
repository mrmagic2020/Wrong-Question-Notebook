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

async function getCategorisation(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { searchParams } = new URL(req.url);
  const attemptId = searchParams.get('attempt_id');

  if (!attemptId || !isValidUuid(attemptId)) {
    return NextResponse.json(
      createApiErrorResponse('attempt_id is required', 400),
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('error_categorisations')
      .select('*')
      .eq('attempt_id', attemptId)
      .eq('user_id', user.id)
      .maybeSingle();

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

    return NextResponse.json(createApiSuccessResponse(data));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getCategorisation, {
  rateLimitType: 'readOnly',
});
