import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import { createServiceClient } from '@/lib/supabase-utils';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/supabase-utils';
import { isValidUuid } from '@/lib/common-utils';
import { QR_SESSION_CONSTANTS } from '@/lib/constants';
import type { QRSessionConsumeResponse } from '@/lib/types';

async function consumeSession(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { user } = await requireUser();
  if (!user) return unauthorised();

  const { sessionId } = await params;

  if (!isValidUuid(sessionId)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid session ID', 400),
      { status: 400 }
    );
  }

  const serviceClient = createServiceClient();

  try {
    // Fetch session and verify ownership
    const { data: session, error: fetchError } = await serviceClient
      .from('qr_upload_sessions')
      .select('user_id, status, file_path, mime_type')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        createApiErrorResponse(
          QR_SESSION_CONSTANTS.ERRORS.SESSION_NOT_FOUND,
          404
        ),
        { status: 404 }
      );
    }

    // Ownership check
    if (session.user_id !== user.id) {
      return NextResponse.json(createApiErrorResponse('Forbidden', 403), {
        status: 403,
      });
    }

    if (session.status !== 'uploaded') {
      return NextResponse.json(
        createApiErrorResponse(QR_SESSION_CONSTANTS.ERRORS.NOT_UPLOADED, 400),
        { status: 400 }
      );
    }

    // Transition to consumed
    const { error: updateError } = await serviceClient
      .from('qr_upload_sessions')
      .update({
        status: 'consumed',
        consumed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('status', 'uploaded');

    if (updateError) {
      console.error('QR session consume error:', updateError);
      return NextResponse.json(
        createApiErrorResponse('Failed to consume session', 500),
        { status: 500 }
      );
    }

    const response: QRSessionConsumeResponse = {
      filePath: session.file_path!,
      mimeType: session.mime_type!,
    };

    return NextResponse.json(createApiSuccessResponse(response));
  } catch (error) {
    console.error('QR session consume error:', error);
    return NextResponse.json(
      createApiErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}

export const POST = withSecurity(consumeSession, {
  rateLimitType: 'api',
});
