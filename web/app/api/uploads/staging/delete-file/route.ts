import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { createClient } from '@/lib/supabase/server';
import { withSecurity } from '@/lib/security-middleware';
import { validateFilePath } from '@/lib/file-security';

const BUCKET = 'problem-uploads';

async function deleteFile(req: Request) {
  const { user } = await requireUser();
  if (!user) return unauthorised();

  const body = await req.json().catch(() => ({}));
  const { path } = body;

  if (!path || typeof path !== 'string') {
    return NextResponse.json(
      { error: 'File path is required' },
      { status: 400 }
    );
  }

  // Validate file path to prevent directory traversal
  if (!validateFilePath(path)) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  // Verify the path belongs to the current user's staging area
  const userStagingPrefix = `user/${user.id}/staging/`;
  if (!path.startsWith(userStagingPrefix)) {
    return NextResponse.json(
      { error: 'Unauthorized to delete this file' },
      { status: 403 }
    );
  }

  try {
    // Use server-side Supabase client for deletion
    const serverSupabase = await createClient();
    const { error } = await serverSupabase.storage.from(BUCKET).remove([path]);

    if (error) {
      console.error('Failed to delete file:', error);
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Unexpected error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

export const DELETE = withSecurity(deleteFile, { rateLimitType: 'fileUpload' });
