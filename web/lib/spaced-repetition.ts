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
 * Maps confidence (1-5) + correctness to SM-2 quality (0-5).
 *
 * Correct answers:
 *   confidence 1 → quality 3 (barely correct)
 *   confidence 2 → quality 3
 *   confidence 3 → quality 4
 *   confidence 4 → quality 4
 *   confidence 5 → quality 5 (perfect)
 *
 * Incorrect answers:
 *   confidence 1 → quality 2 (expected miss)
 *   confidence 2 → quality 2
 *   confidence 3 → quality 1
 *   confidence 4 → quality 1
 *   confidence 5 → quality 0 (hypercorrection: was certain but wrong)
 */
export function mapConfidenceToQuality(
  confidence: number,
  isCorrect: boolean
): number {
  if (isCorrect) {
    if (confidence <= 2) return 3;
    if (confidence <= 4) return 4;
    return 5;
  }
  // Incorrect
  if (confidence <= 2) return 2;
  if (confidence <= 4) return 1;
  return 0; // Hypercorrection effect
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
 * Returns early if isCorrect is null (no marking info).
 * Uses service client for reliability (bypasses RLS).
 */
export async function updateReviewSchedule(
  supabase: SupabaseClient,
  userId: string,
  problemId: string,
  isCorrect: boolean | null,
  confidence?: number | null
): Promise<void> {
  if (isCorrect === null || isCorrect === undefined) return;

  const { DEFAULT_EASE_FACTOR, DEFAULT_INTERVAL, DEFAULT_CONFIDENCE } =
    SPACED_REPETITION_CONSTANTS;

  const effectiveConfidence = confidence ?? DEFAULT_CONFIDENCE;
  const quality = mapConfidenceToQuality(effectiveConfidence, isCorrect);

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

  await supabase.from('review_schedule').upsert(
    {
      user_id: userId,
      problem_id: problemId,
      next_review_at: result.nextReviewAt.toISOString(),
      interval_days: result.intervalDays,
      ease_factor: result.easeFactor,
      repetition_number: result.repetitionNumber,
      last_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,problem_id' }
  );
}
