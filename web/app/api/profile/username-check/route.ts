import { NextRequest, NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { createServiceClient } from '@/lib/supabase-utils';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/common-utils';

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error || !user) return unauthorised();

  const username = req.nextUrl.searchParams.get('username');
  if (!username) {
    return NextResponse.json(
      createApiErrorResponse('username query param required', 400),
      { status: 400 }
    );
  }

  const serviceSupabase = createServiceClient();
  const { data, error: dbError } = await serviceSupabase
    .from('user_profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle();

  if (dbError) {
    return NextResponse.json(
      createApiErrorResponse('Failed to check username availability', 500),
      { status: 500 }
    );
  }

  return NextResponse.json(createApiSuccessResponse({ available: !data }));
}
