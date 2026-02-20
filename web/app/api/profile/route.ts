import { NextRequest, NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { getUserProfile } from '@/lib/user-management';
import { createServiceClient } from '@/lib/supabase-utils';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/common-utils';
import { CreateUserProfileDto } from '@/lib/schemas';

export async function GET() {
  const { user, error } = await requireUser();
  if (error || !user) return unauthorised();

  const profile = await getUserProfile(user.id);
  if (!profile) {
    return NextResponse.json(createApiErrorResponse('Profile not found', 404), {
      status: 404,
    });
  }

  return NextResponse.json(createApiSuccessResponse(profile));
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error || !user) return unauthorised();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(createApiErrorResponse('Invalid JSON body', 400), {
      status: 400,
    });
  }

  const rawBody = body as Record<string, unknown>;

  // Fields that can be explicitly cleared to null
  const clearableFields = [
    'first_name',
    'last_name',
    'bio',
    'date_of_birth',
    'gender',
  ] as const;

  // Extract null/empty-string values before Zod validation (schema doesn't accept null)
  const nullUpdates: Partial<Record<(typeof clearableFields)[number], null>> =
    {};
  for (const key of clearableFields) {
    if (rawBody[key] === null || rawBody[key] === '') {
      nullUpdates[key] = null;
      delete rawBody[key];
    }
  }

  // Strip empty username (omit rather than null)
  if (rawBody.username === '') {
    delete rawBody.username;
  }

  const parsed = CreateUserProfileDto.partial().safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      createApiErrorResponse('Validation failed', 400, parsed.error.flatten()),
      { status: 400 }
    );
  }

  // Merge validated data with explicit null clears
  const validatedData = { ...parsed.data, ...nullUpdates };

  // Check username uniqueness if provided and changed
  if (validatedData.username) {
    const serviceSupabase = createServiceClient();
    const { data: existing } = await serviceSupabase
      .from('user_profiles')
      .select('id')
      .eq('username', validatedData.username)
      .neq('id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        createApiErrorResponse('Username is already taken', 409),
        { status: 409 }
      );
    }
  }

  const serviceSupabase = createServiceClient();
  const { data, error: upsertError } = await serviceSupabase
    .from('user_profiles')
    .upsert({ id: user.id, ...validatedData }, { onConflict: 'id' })
    .select()
    .single();

  if (upsertError || !data) {
    return NextResponse.json(
      createApiErrorResponse('Failed to update profile', 500),
      { status: 500 }
    );
  }

  return NextResponse.json(createApiSuccessResponse(data));
}
