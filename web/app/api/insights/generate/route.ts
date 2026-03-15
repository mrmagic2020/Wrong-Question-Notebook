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
    const supabase = createServiceClient();

    // Check if generation is already in progress
    const { data: activeRow } = await supabase
      .from('insight_digests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'generating')
      .limit(1)
      .maybeSingle();

    if (activeRow) {
      return NextResponse.json(
        createApiErrorResponse(
          'Insights generation is already in progress',
          409
        ),
        { status: 409 }
      );
    }

    // Check cooldown: was a completed digest generated recently?
    const cooldownThreshold = new Date(
      Date.now() - INSIGHT_CONSTANTS.DIGEST_COOLDOWN_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: recentDigests, error: digestQueryError } = await supabase
      .from('insight_digests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
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

    // Insert placeholder row with 'generating' status
    const { data: placeholder, error: placeholderError } = await supabase
      .from('insight_digests')
      .insert({
        user_id: user.id,
        status: 'generating',
        headline: '',
        error_pattern_summary: '',
      })
      .select('id')
      .single();

    if (placeholderError || !placeholder) {
      return NextResponse.json(
        createApiErrorResponse(
          'Failed to start generation',
          500,
          placeholderError?.message
        ),
        { status: 500 }
      );
    }

    // Backfill uncategorised attempts first
    await categoriseUncategorisedAttempts(
      user.id,
      INSIGHT_CONSTANTS.BACKFILL_BATCH_SIZE
    );

    // Generate the digest (updates placeholder row on success)
    const result = await generateDigestForUser(user.id, placeholder.id);

    if ('insufficient_data' in result) {
      // Not enough data — delete placeholder and return progress info
      await supabase.from('insight_digests').delete().eq('id', placeholder.id);

      return NextResponse.json(
        createApiSuccessResponse(
          result,
          'Not enough activity to generate insights yet.'
        )
      );
    }

    return NextResponse.json(createApiSuccessResponse(result));
  } catch (error) {
    // Best-effort: mark any generating rows as failed
    try {
      const supabase = createServiceClient();
      await supabase
        .from('insight_digests')
        .update({ status: 'failed' })
        .eq('user_id', user.id)
        .eq('status', 'generating');
    } catch {
      // ignore cleanup errors
    }

    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(generateInsights, {
  rateLimitType: 'api',
});
