import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { CreateTagDto } from '@/lib/schemas';
import { withSecurity } from '@/lib/security-middleware';
import {
  isValidUuid,
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import {
  revalidateUserTags,
  revalidateSubjectTags,
} from '@/lib/cache-invalidation';

// Cache configuration for this route
export const revalidate = 600; // 10 minutes

async function getTags(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { searchParams } = new URL(req.url);
  const subject_id = searchParams.get('subject_id');
  if (!subject_id) {
    return NextResponse.json(
      createApiErrorResponse('subject_id is required', 400),
      { status: 400 }
    );
  }

  // Validate UUID format
  if (!isValidUuid(subject_id)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid subject ID format', 400),
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .eq('subject_id', subject_id)
      .order('name', { ascending: true });

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

export const GET = withSecurity(getTags, { rateLimitType: 'readOnly' });

async function createTag(req: Request) {
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

  const parsed = CreateTagDto.safeParse(body);
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
    const { subject_id, name } = parsed.data;

    const { data, error } = await supabase
      .from('tags')
      .insert({ user_id: user.id, subject_id, name })
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

    // Invalidate cache after successful creation
    await Promise.all([
      revalidateUserTags(user.id),
      revalidateSubjectTags(parsed.data.subject_id),
    ]);

    return NextResponse.json(createApiSuccessResponse(data), { status: 201 });
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(createTag, { rateLimitType: 'api' });
