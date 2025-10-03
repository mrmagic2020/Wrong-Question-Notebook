import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { CreateAttemptDto } from '@/lib/schemas';
import { withSecurity } from '@/lib/security-middleware';
import {
  isValidUuid,
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';

async function getAttempts(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { searchParams } = new URL(req.url);
  const problem_id = searchParams.get('problem_id');

  if (!problem_id) {
    return NextResponse.json(
      createApiErrorResponse('problem_id is required', 400),
      { status: 400 }
    );
  }

  // Validate UUID format
  if (!isValidUuid(problem_id)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid problem ID format', 400),
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('problem_id', problem_id)
      .order('created_at', { ascending: false });

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

export const GET = withSecurity(getAttempts, { rateLimitType: 'readOnly' });

async function createAttempt(req: Request) {
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

  const parsed = CreateAttemptDto.safeParse(body);
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

  try {
    const payload = {
      ...parsed.data,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('attempts')
      .insert(payload)
      .select()
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

    return NextResponse.json(createApiSuccessResponse(data), { status: 201 });
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(createAttempt, { rateLimitType: 'api' });
