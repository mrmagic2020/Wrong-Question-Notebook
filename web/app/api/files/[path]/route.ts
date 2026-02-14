import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { createServiceClient } from '@/lib/supabase-utils';
import { FILE_CONSTANTS, ERROR_MESSAGES } from '@/lib/constants';
import { createApiErrorResponse, handleAsyncError } from '@/lib/common-utils';

/**
 * GET /api/files/[path] - Serve file content using signed URLs with secure access control
 *
 * Access is granted if:
 * 1. File is in the current user's directory (ownership) - fast path
 * 2. File belongs to a problem the user can view via can_view_problem RPC
 *    (covers public sharing, limited sharing, and smart set sharing)
 *
 * Uses signed URLs for efficient and secure file delivery.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { path } = await params;
  const decodedPath = decodeURIComponent(path);

  // Basic security: Verify the file path is in the expected format
  // Must start with 'user/' followed by a UUID (any user's files)
  const userPathPattern =
    /^user\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//;
  if (!userPathPattern.test(decodedPath)) {
    return NextResponse.json(
      createApiErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 403),
      { status: 403 }
    );
  }

  // Parse bucket and name from the path
  const bucket = FILE_CONSTANTS.STORAGE.BUCKET;
  const name = decodedPath; // Full path is the object name

  // Fast path: owner can always access their own files
  const isUserOwnedFile = decodedPath.startsWith(`user/${user.id}/`);

  if (!isUserOwnedFile) {
    // Non-owned file: check if user can view the problem containing this asset
    // Both RPCs are SECURITY DEFINER so they bypass RLS
    try {
      const { data: problemId, error: problemError } = await supabase
        .rpc('find_problem_by_asset', { p_path: decodedPath })
        .single();

      if (problemError) {
        console.error('Error finding problem for file:', problemError);
        return NextResponse.json(
          createApiErrorResponse(ERROR_MESSAGES.DATABASE_ERROR, 500),
          { status: 500 }
        );
      }

      if (!problemId) {
        return NextResponse.json(
          createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
          { status: 404 }
        );
      }

      // Check if user can view this problem (owner, public, or limited-shared)
      const { data: canView, error: rpcError } = await supabase
        .rpc('can_view_problem', { p_problem_id: problemId })
        .single();

      if (rpcError) {
        console.error('Error checking problem access:', rpcError);
        return NextResponse.json(
          createApiErrorResponse(ERROR_MESSAGES.DATABASE_ERROR, 500),
          { status: 500 }
        );
      }

      if (!canView) {
        return NextResponse.json(
          createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
          { status: 404 }
        );
      }
    } catch (error) {
      console.error('Unexpected error checking file access:', error);
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.INTERNAL_ERROR, 500),
        { status: 500 }
      );
    }
  }

  try {
    // Create a short-lived signed URL using the service client
    const serviceSupabase = createServiceClient();
    const { data: signed, error: signedError } = await serviceSupabase.storage
      .from(bucket)
      .createSignedUrl(name, 120); // 2 minutes expiry

    if (signedError) {
      console.error('Error creating signed URL:', signedError);
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.FILE_UPLOAD_FAILED, 500),
        { status: 500 }
      );
    }

    if (!signed?.signedUrl) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
        { status: 404 }
      );
    }

    // Return a 302 redirect to the signed URL
    return NextResponse.redirect(signed.signedUrl, 302);
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    console.error('Unexpected error creating signed URL:', error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}
