import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import {
  CreateProblemDto,
  PROBLEM_TYPE_VALUES,
  PROBLEM_STATUS_VALUES,
} from '@/lib/schemas';
import { withSecurity } from '@/lib/security-middleware';
import {
  isValidUuid,
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  hasOnlyOwnedAssetPaths,
} from '@/lib/common-utils';
import { ERROR_MESSAGES, CONTENT_LIMIT_CONSTANTS } from '@/lib/constants';
import type { Database } from '@/lib/database.types';
import { checkContentLimit } from '@/lib/content-limits';
import { revalidateProblemComprehensive } from '@/lib/cache-invalidation';
import { createServiceClient } from '@/lib/supabase-utils';

// Cache configuration for this route
export const revalidate = 300; // 5 minutes

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
  const tagIds = Array.from(
    new Set(searchParams.get('tag_ids')?.split(',').filter(Boolean) || [])
  );
  const tagFilterMode =
    searchParams.get('tag_filter_mode') === 'all' ? 'all' : 'any';
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
    type =>
      !PROBLEM_TYPE_VALUES.includes(
        type as (typeof PROBLEM_TYPE_VALUES)[number]
      )
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
    status =>
      !PROBLEM_STATUS_VALUES.includes(
        status as (typeof PROBLEM_STATUS_VALUES)[number]
      )
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
    const { data: tagLinks, error: tagError } = await supabase
      .from('problem_tag')
      .select('problem_id, tag_id')
      .in('tag_id', tagIds)
      .eq('user_id', user.id);

    if (tagError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          tagError.message
        ),
        { status: 500 }
      );
    }

    if (tagFilterMode === 'all') {
      // AND mode: only keep problems that have ALL selected tags
      const countByProblem = new Map<string, number>();
      for (const link of tagLinks || []) {
        countByProblem.set(
          link.problem_id,
          (countByProblem.get(link.problem_id) || 0) + 1
        );
      }
      problemIds = Array.from(countByProblem.entries())
        .filter(([, count]) => count >= tagIds.length)
        .map(([id]) => id);
    } else {
      // OR mode: keep problems that have ANY selected tag
      problemIds = [...new Set(tagLinks?.map(link => link.problem_id) || [])];
    }

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
    // Wrap in double quotes so PostgREST treats the value literally —
    // without this, commas/parens in the search text break .or() parsing.
    const escaped = searchText
      .trim()
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
    const searchTerm = `"%${escaped}%"`;
    const searchConditions: string[] = [];

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
    query = query.in(
      'problem_type',
      problemTypes as Database['public']['Enums']['problem_type_enum'][]
    );
  }

  // Apply status filter
  if (statuses.length > 0) {
    query = query.in(
      'status',
      statuses as Database['public']['Enums']['problem_status_enum'][]
    );
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

  const {
    tag_ids,
    assets,
    solution_assets,
    id: clientProvidedId,
    ...problem
  } = parsed.data;

  // Reject asset paths that don't belong to the current user
  if (!hasOnlyOwnedAssetPaths(user.id, assets, solution_assets)) {
    return NextResponse.json(
      createApiErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 403),
      { status: 403 }
    );
  }

  // Check problem count limit
  const problemLimit = await checkContentLimit(
    user.id,
    CONTENT_LIMIT_CONSTANTS.RESOURCE_TYPES.PROBLEMS_PER_SUBJECT,
    { subjectId: problem.subject_id }
  );
  if (!problemLimit.allowed) {
    return NextResponse.json(
      createApiErrorResponse(
        ERROR_MESSAGES.CONTENT_LIMIT_REACHED,
        403,
        problemLimit
      ),
      { status: 403 }
    );
  }

  // Check storage limit if problem has file assets
  const hasFiles =
    (assets && assets.length > 0) ||
    (solution_assets && solution_assets.length > 0);
  if (hasFiles) {
    const storageLimit = await checkContentLimit(
      user.id,
      CONTENT_LIMIT_CONSTANTS.RESOURCE_TYPES.STORAGE_BYTES
    );
    if (!storageLimit.allowed) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.CONTENT_LIMIT_REACHED,
          403,
          storageLimit
        ),
        { status: 403 }
      );
    }
  }

  // Use client-provided ID if available, otherwise let database generate one
  const problemId = clientProvidedId || undefined;

  // 1) Create problem with assets already in permanent location
  try {
    const { data: created, error: insErr } = await supabase
      .from('problems')
      .insert({
        ...problem,
        id: problemId,
        user_id: user.id,
        assets: assets ?? [],
        solution_assets: solution_assets ?? [],
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

    // Assets are already in permanent location, no moving needed

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

    // Get the tags for the created problem
    const { data: tagLinks } = await supabase
      .from('problem_tag')
      .select('tags:tag_id ( id, name )')
      .eq('problem_id', created.id)
      .eq('user_id', user.id);

    const tags = tagLinks?.map((link: any) => link.tags).filter(Boolean) || [];

    // Insert initial review schedule row
    try {
      const serviceClient = createServiceClient();
      await serviceClient.from('review_schedule').upsert(
        {
          user_id: user.id,
          problem_id: created.id,
          next_review_at: new Date().toISOString(),
          interval_days: 1,
        },
        { onConflict: 'user_id,problem_id' }
      );
    } catch (e) {
      console.error('Failed to create review schedule:', e);
    }

    // Invalidate cache after successful creation
    await revalidateProblemComprehensive(
      created.id,
      parsed.data.subject_id,
      user.id
    );

    return NextResponse.json(
      createApiSuccessResponse({
        ...created,
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
