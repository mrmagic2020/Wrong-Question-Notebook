/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Pure functions for calculating review schedules based on the SuperMemo 2
 * algorithm, plus a database update helper.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { SPACED_REPETITION_CONSTANTS } from './constants';
import {
  isSameDayInTimezone,
  getLocalMidnightAfterDays,
  DEFAULT_TIMEZONE,
} from './timezone-utils';

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
export function calculateNextReview(
  input: ReviewInput,
  userTimezone: string = DEFAULT_TIMEZONE
): ReviewScheduleUpdate {
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

  // Due date is always the user's local midnight, so all problems due on a
  // given day are available from the start of that day.
  const nextReviewAt = getLocalMidnightAfterDays(newInterval, userTimezone);

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
 *
 * Same-day guard: if the problem was already reviewed today, only refreshes
 * next_review_at without advancing SM-2 state (repetition_number, ease_factor,
 * interval_days). This prevents double-advancement when a user edits their
 * assessment or reviews the same problem multiple times in one day.
 */
export async function updateReviewSchedule(
  supabase: SupabaseClient,
  userId: string,
  problemId: string,
  selectedStatus: 'wrong' | 'needs_review' | 'mastered',
  userTimezone: string = DEFAULT_TIMEZONE
): Promise<void> {
  const { DEFAULT_EASE_FACTOR, DEFAULT_INTERVAL } = SPACED_REPETITION_CONSTANTS;

  // Read current schedule
  const { data: existing, error: lookupError } = await supabase
    .from('review_schedule')
    .select('*')
    .eq('user_id', userId)
    .eq('problem_id', problemId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      `Failed to read review schedule: ${lookupError.message}`
    );
  }

  const now = new Date();
  const nowISO = now.toISOString();

  // Check if already reviewed today (in user's timezone) — if so, only refresh
  // next_review_at without advancing SM-2 state
  const isReviewedToday =
    existing?.last_reviewed_at &&
    isSameDayInTimezone(new Date(existing.last_reviewed_at), now, userTimezone);

  let scheduleUpdate: {
    next_review_at: string;
    interval_days: number;
    ease_factor: number;
    repetition_number: number;
  };

  if (isReviewedToday) {
    // Same-day review: preserve SM-2 state, only refresh next_review_at
    const nextReviewAt = getLocalMidnightAfterDays(
      existing.interval_days ?? DEFAULT_INTERVAL,
      userTimezone
    );
    scheduleUpdate = {
      next_review_at: nextReviewAt.toISOString(),
      interval_days: existing.interval_days,
      ease_factor: existing.ease_factor,
      repetition_number: existing.repetition_number,
    };
  } else {
    // First review of the day: full SM-2 advancement
    const quality = mapStatusToQuality(selectedStatus);
    const currentRep = existing?.repetition_number ?? 0;
    const currentEF = existing?.ease_factor ?? DEFAULT_EASE_FACTOR;
    const currentInterval = existing?.interval_days ?? DEFAULT_INTERVAL;

    const result = calculateNextReview(
      {
        repetitionNumber: currentRep,
        easeFactor: currentEF,
        intervalDays: currentInterval,
        quality,
      },
      userTimezone
    );

    scheduleUpdate = {
      next_review_at: result.nextReviewAt.toISOString(),
      interval_days: result.intervalDays,
      ease_factor: result.easeFactor,
      repetition_number: result.repetitionNumber,
    };
  }

  const { error: upsertError } = await supabase.from('review_schedule').upsert(
    {
      user_id: userId,
      problem_id: problemId,
      ...scheduleUpdate,
      last_reviewed_at: nowISO,
      updated_at: nowISO,
    },
    { onConflict: 'user_id,problem_id' }
  );

  if (upsertError) {
    throw new Error(`Failed to upsert review schedule: ${upsertError.message}`);
  }
}
