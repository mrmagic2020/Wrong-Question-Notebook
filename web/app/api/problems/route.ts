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
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import { revalidateProblemComprehensive } from '@/lib/cache-invalidation';

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

  const {
    tag_ids,
    assets,
    solution_assets,
    id: clientProvidedId,
    ...problem
  } = parsed.data;

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
