import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/requireUser';
import { checkContentLimit } from '@/lib/content-limits';
import {
  createApiSuccessResponse,
  createApiErrorResponse,
} from '@/lib/common-utils';
import { CONTENT_LIMIT_CONSTANTS } from '@/lib/constants';

const validTypes = new Set<string>(
  Object.values(CONTENT_LIMIT_CONSTANTS.RESOURCE_TYPES)
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceType: string }> }
) {
  try {
    const { user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resourceType } = await params;
    if (!validTypes.has(resourceType)) {
      return NextResponse.json(
        createApiErrorResponse('Invalid resource type', 400),
        { status: 400 }
      );
    }

    const subjectId =
      request.nextUrl.searchParams.get('subject_id') ?? undefined;

    const result = await checkContentLimit(user.id, resourceType, {
      subjectId,
    });

    return NextResponse.json(createApiSuccessResponse(result));
  } catch (error) {
    console.error('Error checking content limit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
