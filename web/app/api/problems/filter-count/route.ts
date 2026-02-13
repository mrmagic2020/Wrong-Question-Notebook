import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import { FilterConfigSchema } from '@/lib/schemas';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { getFilteredProblems } from '@/lib/review-utils';

async function getFilterCount(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      createApiErrorResponse('Invalid request body', 400),
      { status: 400 }
    );
  }

  const { subject_id, filter_config } = body;

  if (!subject_id || !isValidUuid(subject_id)) {
    return NextResponse.json(
      createApiErrorResponse('Valid subject_id is required', 400),
      { status: 400 }
    );
  }

  const parsed = FilterConfigSchema.safeParse(filter_config);
  if (!parsed.success) {
    return NextResponse.json(
      createApiErrorResponse(
        'Invalid filter config',
        400,
        parsed.error.flatten()
      ),
      { status: 400 }
    );
  }

  try {
    const filterConfig = {
      ...parsed.data,
      days_since_review: parsed.data.days_since_review ?? null,
    };
    const problems = await getFilteredProblems(
      supabase,
      user.id,
      subject_id,
      filterConfig
    );

    return NextResponse.json(
      createApiSuccessResponse({ count: problems.length })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(getFilterCount, { rateLimitType: 'readOnly' });
