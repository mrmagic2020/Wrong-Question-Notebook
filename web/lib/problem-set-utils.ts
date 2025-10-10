// Note: Caching is now handled at the call site level to prevent data leakage

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
 * Check if a user has access to a problem set (owner, public, or limited access)
 */
export async function checkProblemSetAccess(
  supabase: any,
  problemSet: { user_id: string; sharing_level: string },
  userId: string,
  userEmail: string,
  problemSetId: string
): Promise<boolean> {
  const isOwner = problemSet.user_id === userId;
  const isPublic = problemSet.sharing_level === 'public';
  const isLimited = problemSet.sharing_level === 'limited';

  if (isOwner || isPublic) {
    return true;
  }

  if (isLimited) {
    return await checkLimitedAccess(supabase, problemSetId, userEmail);
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
 * Get a problem set with full data including problems and tags
 * This is a pure data-fetching function - caching should be handled at the call site
 */
export async function getProblemSetWithFullData(
  supabase: any,
  problemSetId: string,
  userId: string,
  userEmail: string
) {
  // Get the problem set with problems and their details
  const { data: problemSet, error: problemSetError } = await supabase
    .from('problem_sets')
    .select(
      `
      *,
      subjects(name),
      problem_set_problems(
        problem_id,
        added_at,
        problems(
          id,
          title,
          content,
          problem_type,
          status,
          last_reviewed_date,
          created_at,
          problem_tag(tags:tag_id(id, name))
        )
      ),
      problem_set_shares(
        id,
        shared_with_email
      )
    `
    )
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

  // Transform the data to include problems with tags
  const problems = transformProblemSetProblems(problemSet.problem_set_problems);

  // Transform shared emails
  const shared_with_emails =
    problemSet.problem_set_shares?.map(
      (share: any) => share.shared_with_email
    ) || [];

  return {
    ...problemSet,
    subject_name: problemSet.subjects?.name || 'Unknown',
    problems,
    problem_count: problems.length,
    shared_with_emails,
    isOwner: problemSet.user_id === userId,
  };
}

/**
 * Get basic problem set data for access checking
 * This is a pure data-fetching function - caching should be handled at the call site
 */
export async function getProblemSetBasic(
  supabase: any,
  problemSetId: string,
  userId: string,
  userEmail: string
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
