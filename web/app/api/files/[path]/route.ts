import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'problem-uploads';

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
      { error: 'Unauthorized to access this file' },
      { status: 403 }
    );
  }

  try {
    // Use server-side Supabase client to generate a signed URL
    const serverSupabase = await createClient();
    const { data, error } = await serverSupabase.storage
      .from(BUCKET)
      .createSignedUrl(decodedPath, 300); // 5 minute expiration

    if (error) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json(
        { error: 'Failed to generate file URL' },
        { status: 500 }
      );
    }

    if (!data?.signedUrl) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Redirect to the signed URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error('Unexpected error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
