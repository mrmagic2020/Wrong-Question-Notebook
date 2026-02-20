import { NextRequest, NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { createServiceClient } from '@/lib/supabase-utils';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/common-utils';
import { FILE_CONSTANTS } from '@/lib/constants';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error || !user) return unauthorised();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(createApiErrorResponse('Invalid form data', 400), {
      status: 400,
    });
  }

  const file = formData.get('avatar');
  if (!(file instanceof File)) {
    return NextResponse.json(createApiErrorResponse('No file provided', 400), {
      status: 400,
    });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      createApiErrorResponse(
        'File type not allowed. Use JPEG, PNG, WEBP, or GIF.',
        400
      ),
      { status: 400 }
    );
  }

  if (file.size > FILE_CONSTANTS.STORAGE.AVATAR_MAX_SIZE) {
    return NextResponse.json(
      createApiErrorResponse('File too large. Maximum size is 2MB.', 400),
      { status: 400 }
    );
  }

  const serviceSupabase = createServiceClient();
  const filePath = `${user.id}/avatar`;

  // Delete existing avatar before upload — ignore "not found" but fail on real errors
  const { error: removeError } = await serviceSupabase.storage
    .from(FILE_CONSTANTS.STORAGE.AVATAR_BUCKET)
    .remove([filePath]);
  if (removeError && removeError.message !== 'Object not found') {
    return NextResponse.json(
      createApiErrorResponse('Failed to remove existing avatar', 500),
      { status: 500 }
    );
  }

  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await serviceSupabase.storage
    .from(FILE_CONSTANTS.STORAGE.AVATAR_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(createApiErrorResponse('Upload failed', 500), {
      status: 500,
    });
  }

  // Construct public URL with cache-busting query param
  const { data: publicUrlData } = await serviceSupabase.storage
    .from(FILE_CONSTANTS.STORAGE.AVATAR_BUCKET)
    .getPublicUrl(filePath);

  const baseAvatarUrl = publicUrlData?.publicUrl;
  if (!baseAvatarUrl) {
    return NextResponse.json(
      createApiErrorResponse('Failed to get avatar URL', 500),
      { status: 500 }
    );
  }

  const avatarUrl = `${baseAvatarUrl}?v=${Date.now()}`;

  // Update profile with new avatar URL
  const { error: updateError } = await serviceSupabase
    .from('user_profiles')
    .upsert({ id: user.id, avatar_url: avatarUrl }, { onConflict: 'id' });

  if (updateError) {
    return NextResponse.json(
      createApiErrorResponse('Failed to update profile avatar', 500),
      { status: 500 }
    );
  }

  return NextResponse.json(createApiSuccessResponse({ avatar_url: avatarUrl }));
}

export async function DELETE() {
  const { user, error } = await requireUser();
  if (error || !user) return unauthorised();

  const serviceSupabase = createServiceClient();
  const filePath = `${user.id}/avatar`;

  const { error: removeError } = await serviceSupabase.storage
    .from(FILE_CONSTANTS.STORAGE.AVATAR_BUCKET)
    .remove([filePath]);
  if (removeError && removeError.message !== 'Object not found') {
    return NextResponse.json(
      createApiErrorResponse('Failed to remove avatar', 500),
      { status: 500 }
    );
  }

  const { error: updateError } = await serviceSupabase
    .from('user_profiles')
    .upsert({ id: user.id, avatar_url: null }, { onConflict: 'id' });

  if (updateError) {
    return NextResponse.json(
      createApiErrorResponse('Failed to remove avatar', 500),
      { status: 500 }
    );
  }

  return NextResponse.json(createApiSuccessResponse({ avatar_url: null }));
}
