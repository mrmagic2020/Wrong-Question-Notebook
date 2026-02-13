/**
 * Review session utilities for smart filtering and session management
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Problem,
  FilterConfig,
  SessionConfig,
  ReviewSessionState,
  ReviewSessionResult,
  ReviewSessionSummary,
} from './types';

/**
 * Query problems matching filter criteria for a smart problem set.
 * Follows the same query pattern as /api/problems GET endpoint.
 */
export async function getFilteredProblems(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
  filterConfig: FilterConfig
): Promise<Problem[]> {
  // Handle tag filtering via junction table
  let problemIds: string[] | null = null;
  if (filterConfig.tag_ids.length > 0) {
    const { data: tagLinks } = await supabase
      .from('problem_tag')
      .select('problem_id')
      .in('tag_id', filterConfig.tag_ids)
      .eq('user_id', userId);

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
    .eq('user_id', userId)
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
 * Calculate session statistics from results, state, and current problem statuses.
 */
export function calculateSessionStats(
  results: ReviewSessionResult[],
  sessionState: ReviewSessionState,
  currentStatuses: Record<string, string>
): ReviewSessionSummary {
  const completed = results.filter(r => !r.was_skipped);
  const skipped = results.filter(r => r.was_skipped);
  const { initial_statuses, problem_ids, elapsed_ms } =
    sessionState.session_state;

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
    completed_count: completed.length,
    skipped_count: skipped.length,
    status_counts,
    status_deltas,
    elapsed_ms: elapsed_ms || 0,
    started_at: sessionState.started_at,
    completed_at: sessionState.is_active ? null : sessionState.last_activity_at,
  };
}
