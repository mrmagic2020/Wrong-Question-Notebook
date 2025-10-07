import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { createClient } from '@/lib/supabase/server';
import { FILE_CONSTANTS, ERROR_MESSAGES } from '@/lib/constants';
import { createApiErrorResponse, handleAsyncError } from '@/lib/common-utils';
import { checkProblemSetAccess } from '@/lib/problem-set-utils';

/**
 * Check if a file belongs to a problem in a shared problem set that the user has access to
 * @param supabase - Supabase client instance
 * @param filePath - The file path to check access for
 * @param userId - The user ID requesting access
 * @param userEmail - The user email for limited access checks
 * @returns Promise<boolean> - True if user has access via shared problem set
 */
async function checkSharedProblemSetAccess(
  supabase: any,
  filePath: string,
  userId: string,
  userEmail: string
): Promise<boolean> {
  try {
    // Find all problems that reference this file path
    // Using JSON containment operators for efficient querying
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select(
        `
        id,
        user_id,
        problem_set_problems(
          problem_set_id,
          problem_sets(
            id,
            user_id,
            sharing_level
          )
        )
      `
      )
      .or(
        `assets.cs.{path}.eq.${filePath},solution_assets.cs.{path}.eq.${filePath}`
      )
      .limit(50); // Limit to prevent excessive queries

    if (problemsError) {
      console.error('Error checking shared problem set access:', problemsError);
      return false;
    }

    if (!problems || problems.length === 0) {
      return false;
    }

    // Check if any of these problems are in shared problem sets
    for (const problem of problems) {
      // Skip if the user owns the problem (already handled by main logic)
      if (problem.user_id === userId) {
        continue;
      }

      // Check each problem set this problem belongs to
      for (const psp of problem.problem_set_problems || []) {
        const problemSet = psp.problem_sets;
        if (!problemSet) continue;

        // Check if user has access to this problem set
        const hasAccess = await checkProblemSetAccess(
          supabase,
          problemSet,
          userId,
          userEmail,
          problemSet.id
        );

        if (hasAccess) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking shared problem set access:', error);
    return false;
  }
}

/**
 * GET /api/files/[path] - Serve file content with secure access control
 *
 * Access is granted if:
 * 1. User owns the file (file path starts with user/{userId}/)
 * 2. File is in user's staging directory (temporary uploads)
 * 3. File belongs to a problem in a shared problem set the user has access to
 *    - Public problem sets: accessible to all authenticated users
 *    - Limited problem sets: accessible to users with explicit email sharing
 *    - Private problem sets: accessible only to the owner
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { path } = await params;
  const decodedPath = decodeURIComponent(path);

  // Verify the user owns this file
  const userPrefix = `user/${user.id}/`;
  if (!decodedPath.startsWith(userPrefix)) {
    return NextResponse.json(
      createApiErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 403),
      { status: 403 }
    );
  }

  // Additional security: Verify the user actually owns a problem that references this asset
  // OR the file is in staging (temporary uploads during form editing)
  // OR the file belongs to a problem in a shared problem set the user has access to
  const isStagingFile = decodedPath.includes('/staging/');

  if (!isStagingFile) {
    // First check if the user owns a problem that references this asset
    const { data: userProblems, error: userProblemsError } = await supabase
      .from('problems')
      .select('id, assets, solution_assets')
      .eq('user_id', user.id)
      .limit(100); // Limit to prevent excessive queries

    if (userProblemsError) {
      console.error(
        'Error checking user problem ownership:',
        userProblemsError
      );
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.DATABASE_ERROR, 500),
        { status: 500 }
      );
    }

    // Check if this file path is referenced in any of the user's problems
    const isUserAssetReferenced = userProblems?.some(problem => {
      const allAssets = [
        ...(problem.assets || []),
        ...(problem.solution_assets || []),
      ];
      return allAssets.some(asset => asset && asset.path === decodedPath);
    });

    // If not owned by user, check if it's in a shared problem set
    if (!isUserAssetReferenced) {
      const hasSharedAccess = await checkSharedProblemSetAccess(
        supabase,
        decodedPath,
        user.id,
        user.email || ''
      );

      if (!hasSharedAccess) {
        return NextResponse.json(
          createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
          { status: 404 }
        );
      }
    }
  }
  // For staging files, we only need to verify the user prefix (already done above)

  try {
    // Use server-side Supabase client to download the file content
    const serverSupabase = await createClient();
    const { data, error } = await serverSupabase.storage
      .from(FILE_CONSTANTS.STORAGE.BUCKET)
      .download(decodedPath);

    if (error) {
      console.error('Error downloading file:', error);
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.FILE_UPLOAD_FAILED, 500),
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
        { status: 404 }
      );
    }

    // Convert blob to buffer
    const buffer = await data.arrayBuffer();

    // Determine content type based on file extension
    const getContentType = (path: string) => {
      const ext = path.toLowerCase().split('.').pop();
      switch (ext) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'webp':
          return 'image/webp';
        case 'svg':
          return 'image/svg+xml';
        case 'pdf':
          return 'application/pdf';
        default:
          return 'application/octet-stream';
      }
    };

    const contentType = getContentType(decodedPath);
    const fileName = decodedPath.split('/').pop() || 'file';

    // Check file size to prevent abuse
    const maxSize = FILE_CONSTANTS.MAX_FILE_SIZE.GENERAL;
    if (buffer.byteLength > maxSize) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.FILE_TOO_LARGE, 413),
        { status: 413 }
      );
    }

    // Return the file content with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': `private, max-age=${FILE_CONSTANTS.STORAGE.CACHE_CONTROL}`, // 5 minute cache, private only
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'no-referrer',
        'Content-Security-Policy': "default-src 'self'",
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    });
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    console.error('Unexpected error serving file:', error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}
