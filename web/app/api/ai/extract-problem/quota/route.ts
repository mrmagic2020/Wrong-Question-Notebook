import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/common-utils';
import { getQuotaUsage } from '@/lib/usage-quota';

async function getQuota() {
  const { user } = await requireUser();
  if (!user) return unauthorised();

  try {
    const quota = await getQuotaUsage(user.id);

    return NextResponse.json(
      createApiSuccessResponse({
        used: quota.current_usage,
        limit: quota.daily_limit,
        remaining: quota.remaining,
      })
    );
  } catch {
    return NextResponse.json(
      createApiErrorResponse('Failed to fetch quota info', 500),
      { status: 500 }
    );
  }
}

export const GET = withSecurity(getQuota);
