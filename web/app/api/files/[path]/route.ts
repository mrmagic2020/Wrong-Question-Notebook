import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { createClient } from '@/lib/supabase/server';
import { FILE_CONSTANTS, ERROR_MESSAGES } from '@/lib/constants';
import { createApiErrorResponse, handleAsyncError } from '@/lib/common-utils';

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
  const isStagingFile = decodedPath.includes('/staging/');

  if (!isStagingFile) {
    // For non-staging files, verify they are referenced in a problem
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('id, assets, solution_assets')
      .eq('user_id', user.id);

    if (problemsError) {
      console.error('Error checking problem ownership:', problemsError);
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.DATABASE_ERROR, 500),
        { status: 500 }
      );
    }

    // Check if this file path is referenced in any of the user's problems
    const isAssetReferenced = problems?.some(problem => {
      const allAssets = [
        ...(problem.assets || []),
        ...(problem.solution_assets || []),
      ];
      return allAssets.some(asset => asset.path === decodedPath);
    });

    if (!isAssetReferenced) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
        { status: 404 }
      );
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
