import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import {
  deleteStagingFolder,
  cleanupOldStagingFolders,
} from '@/lib/storage/delete';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';

export async function DELETE(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  let stagingId: string | null = null;

  // Handle both URL parameters and FormData (for sendBeacon)
  const contentType = req.headers.get('content-type');
  if (contentType?.includes('multipart/form-data')) {
    const formData = await req.formData();
    stagingId = formData.get('stagingId') as string;
  } else {
    const { searchParams } = new URL(req.url);
    stagingId = searchParams.get('stagingId');
  }

  if (!stagingId) {
    return NextResponse.json(
      createApiErrorResponse('stagingId is required', 400),
      { status: 400 }
    );
  }

  try {
    await deleteStagingFolder(supabase, user.id, stagingId);
    return NextResponse.json(createApiSuccessResponse({ ok: true }));
  } catch (error) {
    console.error('Failed to delete staging folder:', error);
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

// Clean up old staging folders (safety net)
export async function POST() {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  try {
    await cleanupOldStagingFolders(supabase, user.id);
    return NextResponse.json(createApiSuccessResponse({ ok: true }));
  } catch (error) {
    console.error('Failed to cleanup old staging folders:', error);
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}
