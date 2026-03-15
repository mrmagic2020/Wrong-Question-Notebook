import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/requireUser';
import { createServiceClient } from '@/lib/supabase-utils';
import { FILE_CONSTANTS, ERROR_MESSAGES } from '@/lib/constants';
import { createApiErrorResponse, handleAsyncError } from '@/lib/common-utils';

/**
 * Check if a problem is part of any public problem set.
 * Covers manual sets (via junction table) and smart sets (same subject + owner).
 */
async function isProblemInPublicSet(
  serviceClient: any,
  problemId: string
): Promise<boolean> {
  // Check manual problem sets
  const { data: manualMatch } = await serviceClient
    .from('problem_set_problems')
    .select('problem_set_id, problem_sets!inner(sharing_level)')
    .eq('problem_id', problemId)
    .eq('problem_sets.sharing_level', 'public')
    .limit(1)
    .maybeSingle();

  if (manualMatch) return true;

  // Check smart sets: problem's subject has a public smart set by the same owner
  const { data: problem } = await serviceClient
    .from('problems')
    .select('subject_id, user_id')
    .eq('id', problemId)
    .single();

  if (!problem) return false;

  const { data: smartMatch } = await serviceClient
    .from('problem_sets')
    .select('id')
    .eq('subject_id', problem.subject_id)
    .eq('user_id', problem.user_id)
    .eq('sharing_level', 'public')
    .eq('is_smart', true)
    .limit(1)
    .maybeSingle();

  return !!smartMatch;
}

/**
 * GET /api/files/[path] - Serve file content using signed URLs with secure access control
 *
 * Access is granted if any of:
 * 1. File is in the current user's directory (ownership) - fast path
 * 2. File belongs to a problem the user can view via can_view_problem RPC
 *    (covers public sharing, limited sharing, and smart set sharing)
 * 3. User owns a copied problem that references the file (retained access)
 * 4. (Anonymous) File belongs to a problem in a public problem set
 *
 * Uses signed URLs for efficient and secure file delivery.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string }> }
) {
  const { user, supabase } = await requireUser();

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
  const isUserOwnedFile = user && decodedPath.startsWith(`user/${user.id}/`);

  if (!isUserOwnedFile) {
    const serviceClient = createServiceClient();

    try {
      // Find the problem this asset belongs to (uses service client to bypass RLS)
      const { data: problemId, error: problemError } = await serviceClient
        .rpc('find_problem_by_asset', { p_path: decodedPath })
        .returns<string>()
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

      if (user) {
        // Authenticated non-owner: use can_view_problem RPC
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
          // Fallback: the user may own a copied problem that references
          // this asset. The copy was obtained through legitimate sharing,
          // so the user retains access even if the original sharing changes.
          const { data: ownsCopy } = await supabase
            .rpc('user_owns_problem_with_asset', { p_path: decodedPath })
            .single();

          if (!ownsCopy) {
            return NextResponse.json(
              createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
              { status: 404 }
            );
          }
        }
      } else {
        // Anonymous user: check if problem is in any public problem set
        const isPublic = await isProblemInPublicSet(serviceClient, problemId);
        if (!isPublic) {
          return NextResponse.json(
            createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
            { status: 404 }
          );
        }
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
