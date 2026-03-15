/**
 * Data loading utilities for the insights frontend.
 *
 * These functions use the user's Supabase client (not the service client)
 * so that RLS policies enforce access control.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ErrorCategorisation, InsightDigest } from '@/lib/types';

/**
 * Normalise a topic label: lowercase, trim, collapse whitespace.
 * Used in both categorise-error API and digest-generator.
 */
export function normaliseTopicLabel(label: string): string {
  return label.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Fetch the latest insight digest for a user.
 * Returns null if no digest exists.
 */
export async function getLatestDigest(
  supabase: SupabaseClient,
  userId: string
): Promise<InsightDigest | null> {
  const { data, error } = await supabase
    .from('insight_digests')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return data as InsightDigest;
}

/**
 * Fetch the error categorisation for a specific attempt.
 * Returns null if no categorisation exists.
 */
export async function getErrorCategorisationForAttempt(
  supabase: SupabaseClient,
  attemptId: string
): Promise<ErrorCategorisation | null> {
  const { data, error } = await supabase
    .from('error_categorisations')
    .select('*')
    .eq('attempt_id', attemptId)
    .limit(1)
    .single();

  if (error || !data) return null;

  return data as ErrorCategorisation;
}

/**
 * Fetch all error categorisations for a specific problem,
 * ordered by most recent first.
 */
export async function getErrorCategorisationsForProblem(
  supabase: SupabaseClient,
  problemId: string
): Promise<ErrorCategorisation[]> {
  const { data, error } = await supabase
    .from('error_categorisations')
    .select('*')
    .eq('problem_id', problemId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data as ErrorCategorisation[];
}
