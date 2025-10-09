import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import {
  CreateProblemDto,
  PROBLEM_TYPE_VALUES,
  PROBLEM_STATUS_VALUES,
} from '@/lib/schemas';
import {
  movePathsToProblemWithUser,
  cleanupStagingFiles,
} from '@/lib/storage/move';
import { withSecurity } from '@/lib/security-middleware';
import {
  isValidUuid,
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';

async function getProblems(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subject_id');
  const searchText = searchParams.get('search_text');
  const searchTitle = searchParams.get('search_title') === 'true';
  const searchContent = searchParams.get('search_content') === 'true';
  const problemTypes =
    searchParams.get('problem_types')?.split(',').filter(Boolean) || [];
  const tagIds = searchParams.get('tag_ids')?.split(',').filter(Boolean) || [];
  const statuses =
    searchParams.get('statuses')?.split(',').filter(Boolean) || [];

  // Validate UUID format for subjectId and tagIds
  if (subjectId && !isValidUuid(subjectId)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid subject ID format', 400),
      { status: 400 }
    );
  }

  if (tagIds.length > 0) {
    for (const tagId of tagIds) {
      if (!isValidUuid(tagId)) {
        return NextResponse.json(
          createApiErrorResponse('Invalid tag ID format', 400),
          { status: 400 }
        );
      }
    }
  }

  // Validate problem types
  const invalidTypes = problemTypes.filter(
    type => !PROBLEM_TYPE_VALUES.includes(type as typeof PROBLEM_TYPE_VALUES[number])
  );
  if (invalidTypes.length > 0) {
    return NextResponse.json(
      createApiErrorResponse(
        `Invalid problem types: ${invalidTypes.join(', ')}`,
        400
      ),
      { status: 400 }
    );
  }

  // Validate statuses
  const invalidStatuses = statuses.filter(
    status => !PROBLEM_STATUS_VALUES.includes(status as typeof PROBLEM_STATUS_VALUES[number])
  );
  if (invalidStatuses.length > 0) {
    return NextResponse.json(
      createApiErrorResponse(
        `Invalid statuses: ${invalidStatuses.join(', ')}`,
        400
      ),
      { status: 400 }
    );
  }

  // Handle tag filtering differently - we need to get problem IDs first, then fetch problems
  let problemIds: string[] | null = null;

  if (tagIds.length > 0) {
    // First, get problem IDs that have the specified tags
    const { data: tagLinks } = await supabase
      .from('problem_tag')
      .select('problem_id')
      .in('tag_id', tagIds)
      .eq('user_id', user.id);

    problemIds = tagLinks?.map(link => link.problem_id) || [];

    // If no problems have the specified tags, return empty result
    if (problemIds.length === 0) {
      return NextResponse.json({ data: [] });
    }
  }

  let query = supabase
    .from('problems')
    .select(
      `
    *,
    problem_tag(tags:tag_id(id, name))
  `
    )
    .eq('user_id', user.id);

  if (subjectId) query = query.eq('subject_id', subjectId);

  // Apply problem ID filter if we filtered by tags
  if (problemIds) {
    query = query.in('id', problemIds);
  }

  // Apply text search
  if (searchText && searchText.trim()) {
    const searchTerm = `%${searchText.trim()}%`;
    const searchConditions = [];

    if (searchTitle) {
      searchConditions.push(`title.ilike.${searchTerm}`);
    }
    if (searchContent) {
      // Search in both problem content and solution text
      searchConditions.push(`content.ilike.${searchTerm}`);
      searchConditions.push(`solution_text.ilike.${searchTerm}`);
    }

    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(','));
    }
  }

  // Apply problem type filter
  if (problemTypes.length > 0) {
    query = query.in('problem_type', problemTypes);
  }

  // Apply status filter
  if (statuses.length > 0) {
    query = query.in('status', statuses);
  }

  try {
    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          error.message
        ),
        { status: 500 }
      );
    }

    // Group tags by problem for easier frontend consumption
    const problemsWithTags = (data || []).map(problem => {
      const tags =
        problem.problem_tag?.map((pt: any) => pt.tags).filter(Boolean) || [];
      return {
        ...problem,
        tags,
      };
    });

    return NextResponse.json(createApiSuccessResponse(problemsWithTags));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getProblems, { rateLimitType: 'readOnly' });

async function createProblem(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      createApiErrorResponse(
        ERROR_MESSAGES.INVALID_REQUEST,
        400,
        error as string
      ),
      { status: 400 }
    );
  }

  // Validate request body using Zod schema
  const parsed = CreateProblemDto.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      createApiErrorResponse(
        'Invalid request body',
        400,
        parsed.error.flatten()
      ),
      { status: 400 }
    );
  }

  const { tag_ids, assets, solution_assets, ...problem } = parsed.data;

  // 1) Create minimal row
  try {
    const { data: created, error: insErr } = await supabase
      .from('problems')
      .insert({
        ...problem,
        user_id: user.id,
        assets: [],
        solution_assets: [],
      })
      .select()
      .single();

    if (insErr) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          insErr.message
        ),
        { status: 500 }
      );
    }

    // 2) Attempt to move staged assets using the **user** client
    const stagedProblemPaths = (assets ?? []).map((a: any) => a.path as string);
    const stagedSolutionPaths = (solution_assets ?? []).map(
      (a: any) => a.path as string
    );

    const movedProblem = await movePathsToProblemWithUser(
      supabase,
      stagedProblemPaths,
      created.id,
      user.id
    );
    const movedSolution = await movePathsToProblemWithUser(
      supabase,
      stagedSolutionPaths,
      created.id,
      user.id
    );

    // If a move fails for any item, keep its original staged path (so you don't lose references)
    const finalProblemPaths = movedProblem.map(m => (m.ok ? m.to : m.from));
    const finalSolutionPaths = movedSolution.map(m => (m.ok ? m.to : m.from));

    // 3) Update row with final/staged paths
    const { data: updated, error: updErr } = await supabase
      .from('problems')
      .update({
        assets: finalProblemPaths.map(p => ({ path: p })),
        solution_assets: finalSolutionPaths.map(p => ({ path: p })),
      })
      .eq('id', created.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updErr) {
      return NextResponse.json(
        createApiSuccessResponse({ ...created, assets, solution_assets }),
        { status: 201 }
      );
    }

    // Link tags if present
    if (tag_ids?.length) {
      await supabase.from('problem_tag').insert(
        tag_ids.map((tag_id: string) => ({
          user_id: user.id,
          problem_id: created.id,
          tag_id,
        }))
      );
    }

    // Clean up staging files after successful problem creation
    // Extract staging ID from any staged path (they should all have the same staging ID)
    const allStagedPaths = [...stagedProblemPaths, ...stagedSolutionPaths];
    if (allStagedPaths.length > 0) {
      const firstStagedPath = allStagedPaths[0];
      const pathParts = firstStagedPath.split('/');
      const stagingId = pathParts[3]; // user/{uid}/staging/{stagingId}/...

      if (stagingId) {
        // Clean up staging files in the background (don't wait for it)
        cleanupStagingFiles(supabase, stagingId, user.id).catch(error => {
          console.error('Failed to cleanup staging files:', error);
        });
      }
    }

    // Get the tags for the created problem
    const { data: tagLinks } = await supabase
      .from('problem_tag')
      .select('tags:tag_id ( id, name )')
      .eq('problem_id', created.id)
      .eq('user_id', user.id);

    const tags = tagLinks?.map((link: any) => link.tags).filter(Boolean) || [];

    return NextResponse.json(
      createApiSuccessResponse({
        ...updated,
        tags,
      }),
      { status: 201 }
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(createProblem, {
  rateLimitType: 'problemCreation',
  enableFileValidation: false,
});
