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
 * Calculate session statistics from results and state.
 */
export function calculateSessionStats(
  results: ReviewSessionResult[],
  sessionState: ReviewSessionState
): ReviewSessionSummary {
  const completed = results.filter(r => !r.was_skipped);
  const skipped = results.filter(r => r.was_skipped);
  const correct = completed.filter(r => r.was_correct === true);
  const incorrect = completed.filter(r => r.was_correct === false);

  return {
    total_problems: sessionState.session_state.problem_ids.length,
    completed_count: completed.length,
    skipped_count: skipped.length,
    correct_count: correct.length,
    incorrect_count: incorrect.length,
    started_at: sessionState.started_at,
    completed_at: sessionState.is_active ? null : sessionState.last_activity_at,
  };
}
