import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/supabase-utils';
import { isValidUuid } from '@/lib/common-utils';
import { QR_SESSION_CONSTANTS } from '@/lib/constants';
import type { QRSessionStatusResponse } from '@/lib/types';

async function getStatus(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { sessionId } = await params;

  if (!isValidUuid(sessionId)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid session ID', 400),
      { status: 400 }
    );
  }

  try {
    // RLS ensures only owner can read
    const { data: session, error } = await supabase
      .from('qr_upload_sessions')
      .select('status, file_path, mime_type, expires_at')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json(
        createApiErrorResponse(
          QR_SESSION_CONSTANTS.ERRORS.SESSION_NOT_FOUND,
          404
        ),
        { status: 404 }
      );
    }

    // Check if expired but not yet marked
    let status = session.status;
    if (status === 'pending' && new Date(session.expires_at) < new Date()) {
      status = 'expired';
    }

    const response: QRSessionStatusResponse = {
      status,
      filePath: session.file_path,
      mimeType: session.mime_type,
    };

    return NextResponse.json(createApiSuccessResponse(response));
  } catch (error) {
    console.error('QR session status error:', error);
    return NextResponse.json(
      createApiErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}

export const GET = withSecurity(getStatus, { rateLimitType: 'readOnly' });
