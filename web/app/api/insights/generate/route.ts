import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { INSIGHT_CONSTANTS, ERROR_MESSAGES } from '@/lib/constants';
import {
  generateDigestForUser,
  categoriseUncategorisedAttempts,
} from '@/lib/digest-generator';
import { createServiceClient } from '@/lib/supabase-utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateInsights(req: Request) {
  const { user } = await requireUser();
  if (!user) return unauthorised();

  try {
    // Check cooldown: was a digest generated within the last DIGEST_COOLDOWN_HOURS?
    const supabase = createServiceClient();
    const cooldownThreshold = new Date(
      Date.now() - INSIGHT_CONSTANTS.DIGEST_COOLDOWN_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: recentDigests, error: digestQueryError } = await supabase
      .from('insight_digests')
      .select('*')
      .eq('user_id', user.id)
      .gte('generated_at', cooldownThreshold)
      .order('generated_at', { ascending: false })
      .limit(1);

    if (digestQueryError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          digestQueryError.message
        ),
        { status: 500 }
      );
    }

    if (recentDigests && recentDigests.length > 0) {
      return NextResponse.json(
        createApiSuccessResponse(
          recentDigests[0],
          'Digest was generated recently. Returning the latest digest.'
        )
      );
    }

    // Backfill uncategorised attempts first
    await categoriseUncategorisedAttempts(
      user.id,
      INSIGHT_CONSTANTS.BACKFILL_BATCH_SIZE
    );

    // Generate the digest
    const digest = await generateDigestForUser(user.id);

    if (!digest) {
      return NextResponse.json(
        createApiSuccessResponse(
          { insufficient_data: true },
          'Not enough categorised problems to generate insights. Keep logging your wrong answers and try again later.'
        )
      );
    }

    return NextResponse.json(createApiSuccessResponse(digest));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(generateInsights, {
  rateLimitType: 'api',
});
