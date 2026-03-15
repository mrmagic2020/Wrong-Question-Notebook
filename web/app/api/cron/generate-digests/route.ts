import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-utils';
import {
  generateDigestForUser,
  categoriseUncategorisedAttempts,
} from '@/lib/digest-generator';
import { INSIGHT_CONSTANTS } from '@/lib/constants';
import { logger } from '@/lib/logger';

const CONCURRENCY_LIMIT = 3;

export async function GET(req: Request) {
  // Authenticate via CRON_SECRET
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    // Find active users who have new attempts since their last digest.
    //
    // Strategy:
    // 1. Get users who have at least one attempt with wrong or needs_review status
    // 2. For each, check if they have attempts newer than their last digest
    // Fetch candidate user IDs. We only need distinct user_id values, but
    // Supabase JS doesn't support SELECT DISTINCT on non-primary columns.
    // Limit the result set to avoid fetching unbounded rows, then dedup in JS.
    const { data: candidateUsers, error: usersError } = await supabase
      .from('attempts')
      .select('user_id')
      .in('selected_status', ['wrong', 'needs_review'])
      .order('created_at', { ascending: false })
      .limit(1000);

    if (usersError) {
      logger.error('Cron: failed to query candidate users', usersError, {
        component: 'CronDigests',
        action: 'queryUsers',
      });
      return NextResponse.json(
        { error: 'Failed to query users', details: usersError.message },
        { status: 500 }
      );
    }

    const uniqueUserIds = [
      ...new Set((candidateUsers ?? []).map(r => r.user_id as string)),
    ];

    // Mark stale 'generating' rows as failed before checking
    const staleThreshold = new Date(
      Date.now() - INSIGHT_CONSTANTS.GENERATING_STALE_MINUTES * 60 * 1000
    ).toISOString();

    await supabase
      .from('insight_digests')
      .update({ status: 'failed' })
      .eq('status', 'generating')
      .lt('generated_at', staleThreshold);

    // For each user, check if they need a new digest
    const usersToProcess: string[] = [];

    for (const userId of uniqueUserIds) {
      // Skip users with an active generation in progress
      const { data: generatingRow } = await supabase
        .from('insight_digests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'generating')
        .limit(1)
        .maybeSingle();

      if (generatingRow) continue;

      // Get the user's latest completed digest
      const { data: latestDigest } = await supabase
        .from('insight_digests')
        .select('generated_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestDigest) {
        // No completed digest yet — should generate one
        usersToProcess.push(userId);
        continue;
      }

      // Check if they have attempts newer than the last digest
      const { count } = await supabase
        .from('attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('selected_status', ['wrong', 'needs_review'])
        .gt('created_at', latestDigest.generated_at);

      if (count && count > 0) {
        usersToProcess.push(userId);
      }
    }

    // Process users with concurrency limit using a pool pattern
    let processed = 0;
    let failed = 0;
    const skipped = uniqueUserIds.length - usersToProcess.length;

    const processUser = async (userId: string): Promise<void> => {
      try {
        await categoriseUncategorisedAttempts(
          userId,
          INSIGHT_CONSTANTS.BACKFILL_BATCH_SIZE
        );
        const result = await generateDigestForUser(userId);
        if ('insufficient_data' in result) {
          // Insufficient data — count as skipped rather than failed
        } else {
          processed++;
        }
      } catch (err) {
        failed++;
        logger.error('Cron: failed to generate digest for user', err, {
          component: 'CronDigests',
          action: 'processUser',
          userId,
        });
      }
    };

    // Process in batches of CONCURRENCY_LIMIT
    for (let i = 0; i < usersToProcess.length; i += CONCURRENCY_LIMIT) {
      const batch = usersToProcess.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.allSettled(batch.map(processUser));
    }

    logger.info('Cron digest generation completed', {
      component: 'CronDigests',
      action: 'complete',
      processed: String(processed),
      failed: String(failed),
      skipped: String(skipped),
    });

    return NextResponse.json({
      processed,
      failed,
      skipped,
      total_candidates: uniqueUserIds.length,
    });
  } catch (error) {
    logger.error('Cron: unexpected error during digest generation', error, {
      component: 'CronDigests',
      action: 'run',
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
