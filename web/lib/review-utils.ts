/**
 * Review session utilities for smart filtering and session management
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Problem,
  FilterConfig,
  SessionConfig,
  ReviewSessionState,
  ReviewSessionSummary,
} from './types';

/**
 * Query problems matching filter criteria for a smart problem set.
 * Follows the same query pattern as /api/problems GET endpoint.
 *
 * @param ownerUserId - When viewing a shared problem set, pass the owner's ID
 *   to fetch problems belonging to the owner. Defaults to userId.
 */
export async function getFilteredProblems(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
  filterConfig: FilterConfig,
  ownerUserId?: string
): Promise<Problem[]> {
  const effectiveUserId = ownerUserId ?? userId;

  // Handle tag filtering via junction table
  let problemIds: string[] | null = null;
  if (filterConfig.tag_ids.length > 0) {
    const { data: tagLinks } = await supabase
      .from('problem_tag')
      .select('problem_id')
      .in('tag_id', filterConfig.tag_ids)
      .eq('user_id', effectiveUserId);

    problemIds = tagLinks?.map(link => link.problem_id) || [];
    if (problemIds.length === 0) return [];
  }

  let query = supabase
    .from('problems')
    .select(
      `
      *,
      problem_tag(tags:tag_id(id, name))
    `
    )
    .eq('user_id', effectiveUserId)
    .eq('subject_id', subjectId);

  // Filter by tag-matched problem IDs
  if (problemIds) {
    query = query.in('id', problemIds);
  }

  // Filter by status
  if (filterConfig.statuses.length > 0) {
    query = query.in('status', filterConfig.statuses);
  }

  // Filter by problem type
  if (filterConfig.problem_types.length > 0) {
    query = query.in('problem_type', filterConfig.problem_types);
  }

  // Filter by last reviewed date
  if (filterConfig.days_since_review != null) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filterConfig.days_since_review);
    const cutoffIso = cutoffDate.toISOString();

    if (filterConfig.include_never_reviewed) {
      query = query.or(
        `last_reviewed_date.lt.${cutoffIso},last_reviewed_date.is.null`
      );
    } else {
      query = query.lt('last_reviewed_date', cutoffIso);
    }
  } else if (filterConfig.include_never_reviewed) {
    // No days filter but include_never_reviewed = true is the default (no additional filter)
  }

  const { data, error } = await query.order('created_at', {
    ascending: false,
  });

  if (error) {
    throw new Error(`Failed to query problems: ${error.message}`);
  }

  // Transform tags like /api/problems does
  return (data || []).map(problem => {
    const tags =
      problem.problem_tag?.map((pt: any) => pt.tags).filter(Boolean) || [];
    return {
      ...problem,
      tags,
    };
  });
}

/**
 * Count problems matching filter criteria without fetching full rows.
 * More efficient than getFilteredProblems when only a count is needed.
 *
 * @param ownerUserId - When viewing a shared problem set, pass the owner's ID
 *   to count problems belonging to the owner. Defaults to userId.
 */
export async function getFilteredProblemsCount(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
  filterConfig: FilterConfig,
  ownerUserId?: string
): Promise<number> {
  const effectiveUserId = ownerUserId ?? userId;

  // Handle tag filtering via junction table
  let problemIds: string[] | null = null;
  if (filterConfig.tag_ids.length > 0) {
    const { data: tagLinks } = await supabase
      .from('problem_tag')
      .select('problem_id')
      .in('tag_id', filterConfig.tag_ids)
      .eq('user_id', effectiveUserId);

    problemIds = tagLinks?.map(link => link.problem_id) || [];
    if (problemIds.length === 0) return 0;
  }

  let query = supabase
    .from('problems')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', effectiveUserId)
    .eq('subject_id', subjectId);

  if (problemIds) {
    query = query.in('id', problemIds);
  }

  if (filterConfig.statuses.length > 0) {
    query = query.in('status', filterConfig.statuses);
  }

  if (filterConfig.problem_types.length > 0) {
    query = query.in('problem_type', filterConfig.problem_types);
  }

  if (filterConfig.days_since_review != null) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filterConfig.days_since_review);
    const cutoffIso = cutoffDate.toISOString();

    if (filterConfig.include_never_reviewed) {
      query = query.or(
        `last_reviewed_date.lt.${cutoffIso},last_reviewed_date.is.null`
      );
    } else {
      query = query.lt('last_reviewed_date', cutoffIso);
    }
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Failed to count problems: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Apply session configuration to a problem list (randomize, limit).
 */
export function applySessionConfig(
  problems: Problem[],
  sessionConfig: SessionConfig
): Problem[] {
  let result = [...problems];

  if (sessionConfig.randomize) {
    result = shuffleArray(result);
  }

  if (
    sessionConfig.session_size &&
    result.length > sessionConfig.session_size
  ) {
    result = result.slice(0, sessionConfig.session_size);
  }

  return result;
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Calculate session statistics from session state and current problem statuses.
 * Uses session_state arrays (completed_problem_ids, skipped_problem_ids) for
 * accurate counts instead of result rows which may contain duplicates.
 */
export function calculateSessionStats(
  sessionState: ReviewSessionState,
  currentStatuses: Record<string, string>
): ReviewSessionSummary {
  const {
    initial_statuses,
    problem_ids,
    elapsed_ms,
    completed_problem_ids,
    skipped_problem_ids,
  } = sessionState.session_state;

  // Count current statuses for session problems only
  const status_counts = { mastered: 0, needs_review: 0, wrong: 0 };
  for (const pid of problem_ids) {
    const status = currentStatuses[pid];
    if (status && status in status_counts) {
      status_counts[status as keyof typeof status_counts]++;
    }
  }

  // Compute deltas by comparing with initial statuses
  const status_deltas = { mastered: 0, needs_review: 0, wrong: 0 };
  if (initial_statuses) {
    const initial_counts = { mastered: 0, needs_review: 0, wrong: 0 };
    for (const pid of problem_ids) {
      const status = initial_statuses[pid];
      if (status && status in initial_counts) {
        initial_counts[status as keyof typeof initial_counts]++;
      }
    }
    status_deltas.mastered = status_counts.mastered - initial_counts.mastered;
    status_deltas.needs_review =
      status_counts.needs_review - initial_counts.needs_review;
    status_deltas.wrong = status_counts.wrong - initial_counts.wrong;
  }

  return {
    total_problems: problem_ids.length,
    completed_count: completed_problem_ids.length,
    skipped_count: skipped_problem_ids.length,
    status_counts,
    status_deltas,
    elapsed_ms: elapsed_ms || 0,
    started_at: sessionState.started_at,
    completed_at: sessionState.is_active ? null : sessionState.last_activity_at,
  };
}
