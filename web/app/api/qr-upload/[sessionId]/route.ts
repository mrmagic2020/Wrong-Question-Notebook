import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security-middleware';
import { createServiceClient } from '@/lib/supabase-utils';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  isValidUuid,
} from '@/lib/common-utils';
import { QR_SESSION_CONSTANTS, FILE_CONSTANTS } from '@/lib/constants';

function verifyToken(rawToken: string, storedHash: string): boolean {
  const computedHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    return false;
  }
}

async function handlePhoneUpload(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  if (!isValidUuid(sessionId)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid session ID', 400),
      { status: 400 }
    );
  }

  // Extract token from query params
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json(
      createApiErrorResponse(QR_SESSION_CONSTANTS.ERRORS.INVALID_TOKEN, 403),
      { status: 403 }
    );
  }

  const serviceClient = createServiceClient();

  try {
    // Fetch session
    const { data: session, error: fetchError } = await serviceClient
      .from('qr_upload_sessions')
      .select('*')
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

    // Verify token
    if (!verifyToken(token, session.token_hash)) {
      return NextResponse.json(
        createApiErrorResponse(QR_SESSION_CONSTANTS.ERRORS.INVALID_TOKEN, 403),
        { status: 403 }
      );
    }

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        createApiErrorResponse(
          QR_SESSION_CONSTANTS.ERRORS.SESSION_EXPIRED,
          410
        ),
        { status: 410 }
      );
    }

    // Check status
    if (session.status !== 'pending') {
      return NextResponse.json(
        createApiErrorResponse(
          QR_SESSION_CONSTANTS.ERRORS.SESSION_ALREADY_USED,
          409
        ),
        { status: 409 }
      );
    }

    // Parse form data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        createApiErrorResponse('Invalid form data', 400),
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        createApiErrorResponse('No file provided', 400),
        { status: 400 }
      );
    }

    // Validate MIME type
    if (
      !(QR_SESSION_CONSTANTS.ALLOWED_MIME_TYPES as readonly string[]).includes(
        file.type
      )
    ) {
      return NextResponse.json(
        createApiErrorResponse(
          QR_SESSION_CONSTANTS.ERRORS.INVALID_FILE_TYPE,
          400
        ),
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > QR_SESSION_CONSTANTS.MAX_FILE_SIZE) {
      return NextResponse.json(
        createApiErrorResponse(QR_SESSION_CONSTANTS.ERRORS.FILE_TOO_LARGE, 413),
        { status: 413 }
      );
    }

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `user/${session.user_id}/${QR_SESSION_CONSTANTS.STORAGE_PATH_PREFIX}/${sessionId}/${safeName}`;

    // Upload to storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await serviceClient.storage
      .from(FILE_CONSTANTS.STORAGE.BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: FILE_CONSTANTS.STORAGE.CACHE_CONTROL,
        upsert: false,
      });

    if (uploadError) {
      console.error('QR upload storage error:', uploadError);
      return NextResponse.json(
        createApiErrorResponse('File upload failed', 500),
        { status: 500 }
      );
    }

    // Optimistic concurrency: only update if still pending
    const { data: updated, error: updateError } = await serviceClient
      .from('qr_upload_sessions')
      .update({
        status: 'uploaded',
        file_path: storagePath,
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('status', 'pending')
      .select('id')
      .single();

    if (updateError || !updated) {
      // Another upload beat us — clean up the file we just uploaded
      await serviceClient.storage
        .from(FILE_CONSTANTS.STORAGE.BUCKET)
        .remove([storagePath]);

      return NextResponse.json(
        createApiErrorResponse(
          QR_SESSION_CONSTANTS.ERRORS.SESSION_ALREADY_USED,
          409
        ),
        { status: 409 }
      );
    }

    return NextResponse.json(
      createApiSuccessResponse({ message: 'File uploaded successfully' })
    );
  } catch (error) {
    console.error('QR phone upload error:', error);
    return NextResponse.json(
      createApiErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}

export const POST = withSecurity(handlePhoneUpload, {
  rateLimitType: 'custom',
  customRateLimit: QR_SESSION_CONSTANTS.RATE_LIMITS.PHONE_UPLOAD,
  rateLimitKey: 'ip',
});
