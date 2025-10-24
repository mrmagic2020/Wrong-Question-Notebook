import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { UpdateProblemDto } from '@/lib/schemas';
import { deleteProblemFiles } from '@/lib/storage/delete';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import { revalidateProblemComprehensive } from '@/lib/cache-invalidation';

// Cache configuration for this route
export const revalidate = 300; // 5 minutes

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id } = await params;

  // Get the problem
  const { data: problem, error } = await supabase
    .from('problems')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    return NextResponse.json(
      createApiErrorResponse(ERROR_MESSAGES.DATABASE_ERROR, 500, error.message),
      { status: 500 }
    );
  }

  if (!problem) {
    return NextResponse.json(
      createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
      { status: 404 }
    );
  }

  // Get the tags for this problem
  const { data: tagLinks } = await supabase
    .from('problem_tag')
    .select('tags:tag_id ( id, name )')
    .eq('problem_id', id)
    .eq('user_id', user.id);

  const tags =
    tagLinks?.map((link: { tags: unknown }) => link.tags).filter(Boolean) || [];

  return NextResponse.json(
    createApiSuccessResponse({
      ...problem,
      tags,
    })
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const parsed = UpdateProblemDto.safeParse(body);
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

  const { id } = await params;
  const { tag_ids, assets, solution_assets, ...problem } = parsed.data;

  // 1) Update the problem row (without assets first)
  const { error } = await supabase
    .from('problems')
    .update(problem)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      createApiErrorResponse(ERROR_MESSAGES.DATABASE_ERROR, 500, error.message),
      { status: 500 }
    );
  }

  // 2) Update assets directly (they're already in permanent location)
  if (assets || solution_assets) {
    await supabase
      .from('problems')
      .update({
        assets: assets ?? undefined,
        solution_assets: solution_assets ?? undefined,
      })
      .eq('id', id)
      .eq('user_id', user.id);
  }

  // Reset tags if provided
  if (tag_ids) {
    await supabase
      .from('problem_tag')
      .delete()
      .eq('problem_id', id)
      .eq('user_id', user.id);
    if (tag_ids.length > 0) {
      const tagLinks = tag_ids.map(tag_id => ({
        user_id: user.id,
        problem_id: id,
        tag_id,
      }));
      await supabase.from('problem_tag').insert(tagLinks);
    }
  }

  // Fetch the updated problem with tags for the response
  const { data: updatedProblem, error: fetchError } = await supabase
    .from('problems')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    return NextResponse.json(
      createApiErrorResponse(
        ERROR_MESSAGES.DATABASE_ERROR,
        500,
        fetchError.message
      ),
      { status: 500 }
    );
  }

  // Get the tags for this problem
  const { data: tagLinks } = await supabase
    .from('problem_tag')
    .select('tags:tag_id ( id, name )')
    .eq('problem_id', id)
    .eq('user_id', user.id);

  const tags =
    tagLinks?.map((link: { tags: unknown }) => link.tags).filter(Boolean) || [];

  // Invalidate cache after successful update
  await revalidateProblemComprehensive(id, updatedProblem.subject_id, user.id);

  return NextResponse.json(
    createApiSuccessResponse({
      ...updatedProblem,
      tags,
    })
  );
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id } = await params;

  // Get the problem first to get subject_id for cache invalidation
  const { data: problem, error: fetchError } = await supabase
    .from('problems')
    .select('subject_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    return NextResponse.json(
      createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
      { status: 404 }
    );
  }

  // Best-effort: remove storage for both subfolders
  await deleteProblemFiles(supabase, user.id, id).catch(() => {});

  const { error } = await supabase
    .from('problems')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json(
      createApiErrorResponse(ERROR_MESSAGES.DATABASE_ERROR, 500, error.message),
      { status: 500 }
    );
  }

  // Invalidate cache after successful deletion
  await revalidateProblemComprehensive(id, problem.subject_id, user.id);

  return NextResponse.json(createApiSuccessResponse({ ok: true }));
}
