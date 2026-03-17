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

    // Mark any stale 'generating' rows as failed before checking.
    // Uses a DB-level filter to avoid JS timestamp string comparison.
    const staleThreshold = new Date(
      Date.now() - INSIGHT_CONSTANTS.GENERATING_STALE_MINUTES * 60 * 1000
    ).toISOString();

    const { error: staleCleanupError } = await supabase
      .from('insight_digests')
      .update({ status: 'failed' })
      .eq('user_id', user.id)
      .eq('status', 'generating')
      .lt('generated_at', staleThreshold);

    if (staleCleanupError) {
      logger.error(
        'Failed to clean up stale generating rows',
        staleCleanupError,
        {
          component: 'InsightsGenerate',
          action: 'staleCleanup',
          userId: user.id,
        }
      );
      return NextResponse.json(
        createApiErrorResponse(
          'Failed to prepare for generation. Please try again.',
          500
        ),
        { status: 500 }
      );
    }

    // Check if a non-stale generation is still in progress
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

    // Lightweight activity check before committing to background work.
    // This is a single RPC returning 4 scalars — fast enough to run
    // synchronously so we can return the insufficient_data payload
    // directly instead of losing it in the async after() path.
    const { data: summaryRows, error: summaryError } = await supabase.rpc(
      'get_activity_summary',
      { p_user_id: user.id }
    );

    if (summaryError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          summaryError.message
        ),
        { status: 500 }
      );
    }

    const activity = (Array.isArray(summaryRows)
      ? summaryRows[0]
      : summaryRows) ?? {
      total_problems: 0,
      total_attempts: 0,
      total_subjects: 0,
      problems_with_errors: 0,
    };

    const activityMet =
      activity.total_problems >= INSIGHT_CONSTANTS.MIN_ACTIVITY_FOR_INSIGHTS;
    const errorsMet =
      activity.problems_with_errors >=
      INSIGHT_CONSTANTS.MIN_ERRORS_FOR_FULL_DIGEST;

    if (!activityMet && !errorsMet) {
      return NextResponse.json(
        createApiSuccessResponse(
          {
            insufficient_data: true,
            activity,
            activity_needed: Math.max(
              0,
              INSIGHT_CONSTANTS.MIN_ACTIVITY_FOR_INSIGHTS -
                activity.total_problems
            ),
            errors_needed: Math.max(
              0,
              INSIGHT_CONSTANTS.MIN_ERRORS_FOR_FULL_DIGEST -
                activity.problems_with_errors
            ),
          },
          'Not enough activity to generate insights yet.'
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

        // Generate the digest (updates placeholder row on success).
        // The insufficient_data case is already handled synchronously
        // above, so generateDigestForUser will always proceed to the
        // full/mastery/narrow tier here.
        await generateDigestForUser(user.id, placeholder.id);
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
