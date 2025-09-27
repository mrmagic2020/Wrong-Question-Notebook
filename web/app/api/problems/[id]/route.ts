import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { UpdateProblemDto } from '@/lib/schemas';
import { deleteProblemFiles } from '@/lib/storage/delete';
import {
  movePathsToProblemWithUser,
  cleanupStagingFiles,
} from '@/lib/storage/move';

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

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (!problem)
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });

  // Get the tags for this problem
  const { data: tagLinks } = await supabase
    .from('problem_tag')
    .select('tags:tag_id ( id, name )')
    .eq('problem_id', id)
    .eq('user_id', user.id);

  const tags = tagLinks?.map((link: any) => link.tags).filter(Boolean) || [];

  return NextResponse.json({
    data: {
      ...problem,
      tags,
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateProblemDto.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = await params;
  const { tag_ids, assets, solution_assets, ...problem } = parsed.data;

  // 1) Update the problem row (without assets first)
  const { data, error } = await supabase
    .from('problems')
    .update(problem)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // 2) Handle asset movement from staging to permanent storage
  if (assets || solution_assets) {
    const allProblemPaths = (assets ?? []).map((a: any) => a.path as string);
    const allSolutionPaths = (solution_assets ?? []).map(
      (a: any) => a.path as string
    );

    // Filter out only staged files (files that need to be moved)
    const stagedProblemPaths = allProblemPaths.filter(path =>
      path.includes('/staging/')
    );
    const stagedSolutionPaths = allSolutionPaths.filter(path =>
      path.includes('/staging/')
    );

    // Move only staged assets to permanent storage
    const movedProblem =
      stagedProblemPaths.length > 0
        ? await movePathsToProblemWithUser(
            supabase,
            stagedProblemPaths,
            id,
            user.id
          )
        : [];
    const movedSolution =
      stagedSolutionPaths.length > 0
        ? await movePathsToProblemWithUser(
            supabase,
            stagedSolutionPaths,
            id,
            user.id
          )
        : [];

    // Create mapping from old staged paths to new permanent paths
    const pathMapping = new Map<string, string>();
    movedProblem.forEach((result, i) => {
      if (result.ok) {
        pathMapping.set(stagedProblemPaths[i], result.to);
      }
    });
    movedSolution.forEach((result, i) => {
      if (result.ok) {
        pathMapping.set(stagedSolutionPaths[i], result.to);
      }
    });

    // Update paths: use new permanent paths for moved files, keep existing paths for others
    const finalAssets = allProblemPaths.map(path => ({
      path: pathMapping.get(path) || path,
    }));
    const finalSolutionAssets = allSolutionPaths.map(path => ({
      path: pathMapping.get(path) || path,
    }));

    await supabase
      .from('problems')
      .update({
        assets: finalAssets,
        solution_assets: finalSolutionAssets,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    // Clean up staging files after successful update
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

  return NextResponse.json({ data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id } = await params;

  // Best-effort: remove storage for both subfolders
  await deleteProblemFiles(supabase, user.id, id).catch(() => {});

  const { error } = await supabase
    .from('problems')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
