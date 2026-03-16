import { NextResponse, after } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/common-utils';
import { INSIGHT_CONSTANTS, ERROR_MESSAGES } from '@/lib/constants';
import {
  generateDigestForUser,
  categoriseUncategorisedAttempts,
} from '@/lib/digest-generator';
import { createServiceClient } from '@/lib/supabase-utils';
import { logger } from '@/lib/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateInsights(req: Request) {
  const { user } = await requireUser();
  if (!user) return unauthorised();

  try {
    const supabase = createServiceClient();

    // Check if generation is already in progress
    const { data: activeRow } = await supabase
      .from('insight_digests')
      .select('id, generated_at')
      .eq('user_id', user.id)
      .eq('status', 'generating')
      .limit(1)
      .maybeSingle();

    if (activeRow) {
      // If the row is stale (e.g. the serverless function timed out),
      // mark it as failed and allow a fresh generation to proceed.
      const staleThreshold = new Date(
        Date.now() - INSIGHT_CONSTANTS.GENERATING_STALE_MINUTES * 60 * 1000
      ).toISOString();

      if (activeRow.generated_at < staleThreshold) {
        await supabase
          .from('insight_digests')
          .update({ status: 'failed' })
          .eq('id', activeRow.id);
      } else {
        return NextResponse.json(
          createApiErrorResponse(
            'Insights generation is already in progress',
            409
          ),
          { status: 409 }
        );
      }
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

    // Schedule the heavy work to run after the response is sent
    after(async () => {
      try {
        // Backfill uncategorised attempts first
        await categoriseUncategorisedAttempts(
          user.id,
          INSIGHT_CONSTANTS.BACKFILL_BATCH_SIZE
        );

        // Generate the digest (updates placeholder row on success)
        const result = await generateDigestForUser(user.id, placeholder.id);

        if ('insufficient_data' in result) {
          // Not enough data — delete placeholder
          const bg = createServiceClient();
          await bg.from('insight_digests').delete().eq('id', placeholder.id);
        }
      } catch (error) {
        // Mark placeholder as failed
        try {
          const bg = createServiceClient();
          await bg
            .from('insight_digests')
            .update({ status: 'failed' })
            .eq('id', placeholder.id);
        } catch {
          // ignore cleanup errors
        }
        logger.error('Background digest generation failed', error, {
          component: 'InsightsGenerate',
          action: 'afterCallback',
          userId: user.id,
        });
      }
    });

    // Return 202 immediately — client should poll /api/insights/status
    return NextResponse.json(
      createApiSuccessResponse(
        { id: placeholder.id, status: 'generating' },
        'Digest generation started. Poll /api/insights/status for updates.'
      ),
      { status: 202 }
    );
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

    logger.error('Insights generation request failed', error, {
      component: 'InsightsGenerate',
      action: 'generateInsights',
      userId: user.id,
    });
    return NextResponse.json(
      createApiErrorResponse('Failed to start generation', 500),
      { status: 500 }
    );
  }
}

export const POST = withSecurity(generateInsights, {
  rateLimitType: 'api',
});
