import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'problem-uploads';

export async function DELETE(req: Request) {
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

  // Verify the path belongs to the current user (either staging or permanent storage)
  const userPrefix = `user/${user.id}/`;
  if (!path.startsWith(userPrefix)) {
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
