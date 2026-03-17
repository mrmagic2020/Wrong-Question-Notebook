import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { INSIGHT_CONSTANTS } from '@/lib/constants';
import { createServiceClient } from '@/lib/supabase-utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getInsightStatus(req: Request) {
  const { user } = await requireUser();
  if (!user) return unauthorised();

  try {
    const supabase = createServiceClient();

    // Fetch the latest digest row (any status)
    const { data: latest } = await supabase
      .from('insight_digests')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest) {
      return NextResponse.json(
        createApiSuccessResponse({ status: 'none', digest: null })
      );
    }

    if (latest.status === 'generating') {
      // Auto-fail stale generating rows so the user isn't stuck forever
      const staleMs = INSIGHT_CONSTANTS.GENERATING_STALE_MINUTES * 60 * 1000;
      const isStale =
        Date.now() - new Date(latest.generated_at).getTime() > staleMs;

      if (isStale) {
        await supabase
          .from('insight_digests')
          .update({ status: 'failed' })
          .eq('id', latest.id);

        return NextResponse.json(
          createApiSuccessResponse({ status: 'failed', digest: null })
        );
      }

      return NextResponse.json(
        createApiSuccessResponse({ status: 'generating', digest: null })
      );
    }

    if (latest.status === 'failed') {
      return NextResponse.json(
        createApiSuccessResponse({ status: 'failed', digest: null })
      );
    }

    return NextResponse.json(
      createApiSuccessResponse({ status: 'completed', digest: latest })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getInsightStatus, {
  rateLimitType: 'api',
});
