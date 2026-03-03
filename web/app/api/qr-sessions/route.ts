import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import { createServiceClient } from '@/lib/supabase-utils';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/supabase-utils';
import { QR_SESSION_CONSTANTS, FILE_CONSTANTS } from '@/lib/constants';
import type { QRSessionCreateResponse } from '@/lib/types';

async function createSession(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  try {
    const serviceClient = createServiceClient();

    // Cleanup: delete user's stale sessions + their storage files.
    // Targets:
    //   1. consumed / expired sessions (terminal — safe to delete)
    //   2. pending / uploaded sessions past their expires_at
    const now = new Date().toISOString();

    const { data: stale } = await serviceClient
      .from('qr_upload_sessions')
      .select('id, file_path')
      .eq('user_id', user.id)
      .or(
        `status.in.(consumed,expired),` +
          `and(status.in.(pending,uploaded),expires_at.lt.${now})`
      );

    if (stale && stale.length > 0) {
      const staleIds = stale.map(s => s.id);
      const filePaths = stale
        .map(s => s.file_path)
        .filter((p): p is string => !!p);

      // Fire-and-forget: remove storage files then delete rows
      (async () => {
        try {
          if (filePaths.length > 0) {
            await serviceClient.storage
              .from(FILE_CONSTANTS.STORAGE.BUCKET)
              .remove(filePaths);
          }
          await serviceClient
            .from('qr_upload_sessions')
            .delete()
            .in('id', staleIds);
        } catch {
          // Best-effort cleanup — don't block session creation
        }
      })();
    }

    // Generate token
    const rawToken = crypto
      .randomBytes(QR_SESSION_CONSTANTS.TOKEN_BYTES)
      .toString('base64url');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Insert session
    const { data: session, error } = await supabase
      .from('qr_upload_sessions')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        status: 'pending',
      })
      .select('id, expires_at')
      .single();

    if (error || !session) {
      console.error('Failed to create QR session:', error);
      return NextResponse.json(
        createApiErrorResponse('Failed to create session', 500),
        { status: 500 }
      );
    }

    // Build upload URL
    const baseUrl =
      req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const uploadUrl = `${protocol}://${baseUrl}/upload/${session.id}?token=${rawToken}`;

    const response: QRSessionCreateResponse = {
      sessionId: session.id,
      token: rawToken,
      expiresAt: session.expires_at,
      uploadUrl,
    };

    return NextResponse.json(createApiSuccessResponse(response));
  } catch (error) {
    console.error('QR session creation error:', error);
    return NextResponse.json(
      createApiErrorResponse('Internal server error', 500),
      { status: 500 }
    );
  }
}

export const POST = withSecurity(createSession, {
  rateLimitType: 'custom',
  customRateLimit: QR_SESSION_CONSTANTS.RATE_LIMITS.SESSION_CREATION,
});
