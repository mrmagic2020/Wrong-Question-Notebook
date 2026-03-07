/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Pure functions for calculating review schedules based on the SuperMemo 2
 * algorithm, plus a database update helper.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { SPACED_REPETITION_CONSTANTS } from './constants';

// =====================================================
// Types
// =====================================================

export interface ReviewInput {
  repetitionNumber: number;
  easeFactor: number;
  intervalDays: number;
  quality: number; // 0-5 SM-2 quality rating
}

export interface ReviewScheduleUpdate {
  repetitionNumber: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: Date;
}

// =====================================================
// Quality Mapping
// =====================================================

/**
 * Maps a three-tier problem status to an SM-2 quality score (0-5).
 *
 *   wrong        → quality 1  (incorrect, reset interval)
 *   needs_review  → quality 3  (correct but shaky, advance slowly)
 *   mastered      → quality 5  (perfect, advance fastest)
 */
export function mapStatusToQuality(
  selectedStatus: 'wrong' | 'needs_review' | 'mastered'
): number {
  switch (selectedStatus) {
    case 'wrong':
      return 1;
    case 'needs_review':
      return 3;
    case 'mastered':
      return 5;
  }
}

// =====================================================
// SM-2 Core Algorithm
// =====================================================

/**
 * Calculates the next review schedule using the SM-2 algorithm.
 *
 * Quality >= 3 (correct): advance repetition, compute new interval
 * Quality < 3 (incorrect): reset repetition to 0, interval to 1
 */
export function calculateNextReview(input: ReviewInput): ReviewScheduleUpdate {
  const { repetitionNumber, easeFactor, intervalDays, quality } = input;
  const { MIN_EASE_FACTOR, INITIAL_INTERVALS } = SPACED_REPETITION_CONSTANTS;

  let newRep: number;
  let newEF: number;
  let newInterval: number;

  if (quality >= 3) {
    // Correct response
    newRep = repetitionNumber + 1;

    if (newRep === 1) {
      newInterval = INITIAL_INTERVALS[0]; // 1 day
    } else if (newRep === 2) {
      newInterval = INITIAL_INTERVALS[1]; // 3 days
    } else {
      newInterval = Math.round(intervalDays * easeFactor);
    }

    // Adjust ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEF = Math.max(newEF, MIN_EASE_FACTOR);
  } else {
    // Incorrect response: reset
    newRep = 0;
    newInterval = 1;
    newEF = easeFactor; // Don't change EF on failure
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    repetitionNumber: newRep,
    easeFactor: newEF,
    intervalDays: newInterval,
    nextReviewAt,
  };
}

// =====================================================
// Database Update Helper
// =====================================================

/**
 * Reads the current review schedule for a problem, applies SM-2, and upserts.
 * Uses the three-tier selectedStatus to derive the SM-2 quality score.
 * Uses service client for reliability (bypasses RLS).
 */
export async function updateReviewSchedule(
  supabase: SupabaseClient,
  userId: string,
  problemId: string,
  selectedStatus: 'wrong' | 'needs_review' | 'mastered'
): Promise<void> {
  const { DEFAULT_EASE_FACTOR, DEFAULT_INTERVAL } = SPACED_REPETITION_CONSTANTS;

  const quality = mapStatusToQuality(selectedStatus);

  // Read current schedule
  const { data: existing } = await supabase
    .from('review_schedule')
    .select('*')
    .eq('user_id', userId)
    .eq('problem_id', problemId)
    .single();

  const currentRep = existing?.repetition_number ?? 0;
  const currentEF = existing?.ease_factor ?? DEFAULT_EASE_FACTOR;
  const currentInterval = existing?.interval_days ?? DEFAULT_INTERVAL;

  const result = calculateNextReview({
    repetitionNumber: currentRep,
    easeFactor: currentEF,
    intervalDays: currentInterval,
    quality,
  });

  const now = new Date().toISOString();
  const { error: upsertError } = await supabase
    .from('review_schedule')
    .upsert(
      {
        user_id: userId,
        problem_id: problemId,
        next_review_at: result.nextReviewAt.toISOString(),
        interval_days: result.intervalDays,
        ease_factor: result.easeFactor,
        repetition_number: result.repetitionNumber,
        last_reviewed_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id,problem_id' }
    );

  if (upsertError) {
    throw new Error(
      `Failed to upsert review schedule: ${upsertError.message}`
    );
  }
}
