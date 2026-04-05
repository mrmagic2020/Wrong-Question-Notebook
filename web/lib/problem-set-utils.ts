// Note: Caching is now handled at the call site level to prevent data leakage
import { getFilteredProblems } from './review-utils';
import { FilterConfig } from './types';
import { createServiceClient } from './supabase-utils';

/**
 * Check if a user has limited access to a problem set
 */
export async function checkLimitedAccess(
  supabase: any,
  problemSetId: string,
  userEmail: string
): Promise<boolean> {
  try {
    const { data: share, error } = await supabase
      .from('problem_set_shares')
      .select('id')
      .eq('problem_set_id', problemSetId)
      .eq('shared_with_email', userEmail)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking limited access:', error);
      return false;
    }

    return !!share;
  } catch (error) {
    console.error('Error checking limited access:', error);
    return false;
  }
}

/**
 * Check if a user has access to a problem set (owner, public, or limited access).
 * Passing null for userId/userEmail indicates an anonymous (unauthenticated) user;
 * anonymous users can only access public problem sets.
 */
export async function checkProblemSetAccess(
  supabase: any,
  problemSet: { user_id: string; sharing_level: string },
  userId: string | null,
  userEmail: string | null,
  problemSetId: string
): Promise<boolean> {
  const isPublic = problemSet.sharing_level === 'public';

  // Anonymous users can only access public sets
  if (!userId) {
    return isPublic;
  }

  const isOwner = problemSet.user_id === userId;
  const isLimited = problemSet.sharing_level === 'limited';

  if (isOwner || isPublic) {
    return true;
  }

  if (isLimited) {
    return await checkLimitedAccess(supabase, problemSetId, userEmail || '');
  }

  return false;
}

/**
 * Transform problem set problems data to include tags
 */
export function transformProblemSetProblems(problemSetProblems: any[]): any[] {
  return (
    problemSetProblems
      ?.map((psp: any) => {
        const problem = psp.problems;
        if (!problem) {
          console.warn(
            'Problem not found for problem_set_problem:',
            psp.problem_id
          );
          return null;
        }

        // Extract tags from the nested structure
        const tags =
          problem?.problem_tag?.map((pt: any) => pt.tags).filter(Boolean) || [];

        return {
          ...problem,
          tags,
          added_at: psp.added_at,
        };
      })
      .filter(Boolean) || []
  );
}

/**
 * Columns to select from problem_sets (excludes `fts` tsvector which is
 * only needed for full-text search, not for detail page rendering).
 */
const PROBLEM_SET_COLUMNS = `
  id, user_id, subject_id, name, description, sharing_level,
  created_at, updated_at, is_smart, filter_config, session_config,
  allow_copying, is_listed, discovery_subject
`;

/**
 * Get a problem set with full data including problems and tags.
 *
 * Uses a two-query pattern:
 *  1. Lightweight metadata fetch (no nested problem joins, no fts column)
 *  2. Targeted problems fetch — smart sets use filter evaluation,
 *     manual sets query the junction table with nested problem/tag joins
 *
 * This avoids the 4-level PostgREST embedded select that generated
 * expensive lateral subqueries, and skips the empty junction-table
 * join for smart sets entirely.
 */
export async function getProblemSetWithFullData(
  supabase: any,
  problemSetId: string,
  userId: string | null,
  userEmail: string | null
) {
  // Step 1: Fetch problem set metadata (lightweight — no problem joins)
  const { data: problemSet, error: problemSetError } = await supabase
    .from('problem_sets')
    .select(
      `
      ${PROBLEM_SET_COLUMNS},
      subjects(name),
      problem_set_shares(id, shared_with_email)
    `
    )
    .eq('id', problemSetId)
    .single();

  if (problemSetError) {
    console.error('Error loading problem set:', problemSetError);
    return null;
  }

  // Step 2: Check access permissions
  const hasAccess = await checkProblemSetAccess(
    supabase,
    problemSet,
    userId,
    userEmail,
    problemSetId
  );

  if (!hasAccess) {
    return null;
  }

  // Step 3: Fetch problems separately based on set type
  const isOwner = !!userId && problemSet.user_id === userId;
  const ownerUserId = problemSet.user_id;
  let problems;

  if (problemSet.is_smart && problemSet.filter_config) {
    // Smart sets: filter-based query (junction table is always empty)
    const filterConfig: FilterConfig = {
      tag_ids: problemSet.filter_config.tag_ids ?? [],
      statuses: problemSet.filter_config.statuses ?? [],
      problem_types: problemSet.filter_config.problem_types ?? [],
      days_since_review: problemSet.filter_config.days_since_review ?? null,
      include_never_reviewed:
        problemSet.filter_config.include_never_reviewed ?? true,
    };
    // For shared smart sets, use service client to bypass RLS since
    // smart set problems aren't in the junction table
    const queryClient = isOwner ? supabase : createServiceClient();
    const filtered = await getFilteredProblems(
      queryClient,
      ownerUserId,
      problemSet.subject_id,
      filterConfig,
      ownerUserId
    );
    problems = filtered.map(p => ({
      ...p,
      added_at: p.created_at, // Smart sets don't have added_at; use created_at
    }));
  } else {
    // Manual sets: fetch problems via junction table (separate query)
    const { data: junctionRows, error: problemsError } = await supabase
      .from('problem_set_problems')
      .select(
        `
        problem_id,
        added_at,
        problems(
          id, title, content, problem_type, status,
          last_reviewed_date, created_at,
          problem_tag(tags:tag_id(id, name))
        )
      `
      )
      .eq('problem_set_id', problemSetId);

    if (problemsError) {
      console.error('Error loading problem set problems:', problemsError);
      problems = [];
    } else {
      problems = transformProblemSetProblems(junctionRows || []);
    }
  }

  // Transform shared emails
  const shared_with_emails =
    problemSet.problem_set_shares?.map(
      (share: any) => share.shared_with_email
    ) || [];

  // Fetch owner profile for non-owners
  let ownerProfile = null;
  if (!isOwner) {
    const profileClient = createServiceClient();
    const { data: profile } = await profileClient
      .from('user_profiles')
      .select('username, first_name, last_name, avatar_url, bio, gender')
      .eq('id', ownerUserId)
      .single();
    ownerProfile = profile || null;
  }

  return {
    ...problemSet,
    subject_name: problemSet.subjects?.name || 'Unknown',
    problems,
    problem_count: problems.length,
    shared_with_emails,
    isOwner,
    ownerProfile,
  };
}

/**
 * Get basic problem set data for access checking
 * This is a pure data-fetching function - caching should be handled at the call site
 */
export async function getProblemSetBasic(
  supabase: any,
  problemSetId: string,
  userId: string | null,
  userEmail: string | null
) {
  // Get the basic problem set data
  const { data: problemSet, error: problemSetError } = await supabase
    .from('problem_sets')
    .select('id, user_id, sharing_level')
    .eq('id', problemSetId)
    .single();

  if (problemSetError) {
    console.error('Error loading problem set:', problemSetError);
    return null;
  }

  // Check access permissions
  const hasAccess = await checkProblemSetAccess(
    supabase,
    problemSet,
    userId,
    userEmail,
    problemSetId
  );

  if (!hasAccess) {
    return null;
  }

  return problemSet;
}
