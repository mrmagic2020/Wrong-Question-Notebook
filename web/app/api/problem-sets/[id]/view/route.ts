import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { createServiceClient } from '@/lib/supabase-utils';
import { checkProblemSetAccess } from '@/lib/problem-set-utils';
import { createHash } from 'crypto';

async function recordView(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await requireUser();
  const { id } = await params;

  if (!isValidUuid(id)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid problem set ID format', 400),
      { status: 400 }
    );
  }

  try {
    const serviceClient = createServiceClient();

    // Verify the problem set exists and user has access
    const { data: problemSet } = await serviceClient
      .from('problem_sets')
      .select('user_id, sharing_level')
      .eq('id', id)
      .single();

    if (!problemSet) {
      return NextResponse.json(createApiSuccessResponse({ success: true }));
    }

    const hasAccess = await checkProblemSetAccess(
      serviceClient,
      problemSet,
      user?.id || null,
      user?.email || null,
      id
    );

    if (!hasAccess) {
      return NextResponse.json(createApiSuccessResponse({ success: true }));
    }

    // Compute viewer hash for deduplication
    let viewerHash: string;
    if (user) {
      viewerHash = createHash('sha256').update(user.id).digest('hex');
    } else {
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      const ua = req.headers.get('user-agent') || 'unknown';
      viewerHash = createHash('sha256').update(`${ip}:${ua}`).digest('hex');
    }

    // Fire-and-forget: record the view via database function
    await serviceClient.rpc('record_problem_set_view', {
      p_problem_set_id: id,
      p_viewer_hash: viewerHash,
      p_user_id: user?.id || null,
    });

    return NextResponse.json(createApiSuccessResponse({ success: true }));
  } catch (error) {
    // View tracking should never fail the user experience
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(recordView, { rateLimitType: 'readOnly' });
