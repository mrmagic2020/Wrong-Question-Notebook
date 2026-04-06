import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { checkProblemSetAccess } from '@/lib/problem-set-utils';
import { getFilteredProblems } from '@/lib/review-utils';
import { FilterConfig } from '@/lib/types';
import { createServiceClient } from '@/lib/supabase-utils';
import {
  revalidateUserProblemSets,
  revalidateDiscovery,
} from '@/lib/cache-invalidation';
import { checkContentLimit } from '@/lib/content-limits';
import { CONTENT_LIMIT_CONSTANTS, ERROR_MESSAGES } from '@/lib/constants';
import { z } from 'zod';

const CopyProblemSetBody = z.object({
  target_subject_id: z.uuid(),
  copy_tags: z.boolean().default(true),
});

async function copyProblemSet(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id } = await params;

  if (!isValidUuid(id)) {
    return NextResponse.json(
      createApiErrorResponse('Invalid problem set ID format', 400),
      { status: 400 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      createApiErrorResponse('Invalid request body', 400),
      { status: 400 }
    );
  }

  const parsed = CopyProblemSetBody.safeParse(body);
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

  const { target_subject_id, copy_tags } = parsed.data;

  try {
    // Use service client for cross-user access
    const serviceClient = createServiceClient();

    // Fetch the source problem set
    const { data: sourceProblemSet, error: sourceError } = await serviceClient
      .from('problem_sets')
      .select(
        `
        *,
        problem_set_problems(
          problem_id,
          problems(
            id, title, content, problem_type, correct_answer,
            answer_config, auto_mark, status, created_at,
            solution_text, assets, solution_assets,
            problem_tag(tags:tag_id(id, name))
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (sourceError || !sourceProblemSet) {
      return NextResponse.json(
        createApiErrorResponse('Problem set not found', 404),
        { status: 404 }
      );
    }

    // Check access
    const hasAccess = await checkProblemSetAccess(
      serviceClient,
      sourceProblemSet,
      user.id,
      user.email || '',
      id
    );

    if (!hasAccess) {
      return NextResponse.json(createApiErrorResponse('Access denied', 403), {
        status: 403,
      });
    }

    // Check allow_copying
    if (!sourceProblemSet.allow_copying) {
      return NextResponse.json(
        createApiErrorResponse(
          'The owner has disabled copying for this problem set',
          403
        ),
        { status: 403 }
      );
    }

    // Verify user owns the target subject
    const { data: targetSubject, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', target_subject_id)
      .eq('user_id', user.id)
      .single();

    if (subjectError || !targetSubject) {
      return NextResponse.json(
        createApiErrorResponse('Target subject not found', 404),
        { status: 404 }
      );
    }

    // Get source problems
    let sourceProblems: any[];
    if (sourceProblemSet.is_smart && sourceProblemSet.filter_config) {
      // For smart sets, resolve the current matching problems
      const filterConfig: FilterConfig = {
        tag_ids: sourceProblemSet.filter_config.tag_ids ?? [],
        statuses: sourceProblemSet.filter_config.statuses ?? [],
        problem_types: sourceProblemSet.filter_config.problem_types ?? [],
        days_since_review:
          sourceProblemSet.filter_config.days_since_review ?? null,
        include_never_reviewed:
          sourceProblemSet.filter_config.include_never_reviewed ?? true,
      };
      sourceProblems = await getFilteredProblems(
        serviceClient,
        sourceProblemSet.user_id,
        sourceProblemSet.subject_id,
        filterConfig,
        sourceProblemSet.user_id
      );
    } else {
      sourceProblems =
        sourceProblemSet.problem_set_problems
          ?.map((psp: any) => {
            const p = psp.problems;
            if (!p) return null;
            const tags =
              p.problem_tag?.map((pt: any) => pt.tags).filter(Boolean) || [];
            return { ...p, tags };
          })
          .filter(Boolean) || [];
    }

    if (sourceProblems.length === 0) {
      return NextResponse.json(
        createApiErrorResponse('No problems to copy', 400),
        { status: 400 }
      );
    }

    // Check content limits before proceeding with inserts
    const [problemSetLimit, problemLimit] = await Promise.all([
      checkContentLimit(
        user.id,
        CONTENT_LIMIT_CONSTANTS.RESOURCE_TYPES.PROBLEM_SETS
      ),
      checkContentLimit(
        user.id,
        CONTENT_LIMIT_CONSTANTS.RESOURCE_TYPES.PROBLEMS_PER_SUBJECT,
        { subjectId: target_subject_id }
      ),
    ]);

    if (!problemSetLimit.allowed) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.CONTENT_LIMIT_REACHED,
          403,
          problemSetLimit
        ),
        { status: 403 }
      );
    }

    if (problemLimit.remaining < sourceProblems.length) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.CONTENT_LIMIT_REACHED, 403, {
          ...problemLimit,
          allowed: false,
          copy_count: sourceProblems.length,
        }),
        { status: 403 }
      );
    }

    // Handle tag mapping
    const tagMapping: Record<string, string> = {};
    let tagCount = 0;

    if (copy_tags) {
      // Collect all unique tags from source problems
      const uniqueTags = new Map<string, string>();
      sourceProblems.forEach((p: any) => {
        (p.tags || []).forEach((tag: any) => {
          if (!uniqueTags.has(tag.id)) {
            uniqueTags.set(tag.id, tag.name);
          }
        });
      });

      if (uniqueTags.size > 0) {
        // Check which tags already exist in target subject by name
        const tagNames = Array.from(uniqueTags.values());
        const { data: existingTags } = await supabase
          .from('tags')
          .select('id, name')
          .eq('subject_id', target_subject_id)
          .in('name', tagNames);

        const existingByName = new Map(
          (existingTags || []).map((t: any) => [t.name, t.id])
        );

        // Create missing tags
        const missingTags: {
          name: string;
          subject_id: string;
          user_id: string;
        }[] = [];
        const sourceIdToName = new Map(uniqueTags.entries());

        for (const [, tagName] of sourceIdToName) {
          if (!existingByName.has(tagName)) {
            missingTags.push({
              name: tagName,
              subject_id: target_subject_id,
              user_id: user.id,
            });
          }
        }

        if (missingTags.length > 0) {
          const { data: createdTags, error: tagCreateError } = await supabase
            .from('tags')
            .insert(missingTags)
            .select('id, name');

          if (tagCreateError) {
            console.error('Failed to create tags:', tagCreateError);
          }

          (createdTags || []).forEach((t: any) => {
            existingByName.set(t.name, t.id);
          });
        }

        // Build source_tag_id -> new_tag_id mapping
        for (const [sourceTagId, tagName] of sourceIdToName) {
          const newTagId = existingByName.get(tagName);
          if (newTagId) {
            tagMapping[sourceTagId] = newTagId;
          }
        }
        tagCount = Object.keys(tagMapping).length;
      }
    }

    // Bulk insert copied problems
    const problemInserts = sourceProblems.map((p: any) => ({
      user_id: user.id,
      subject_id: target_subject_id,
      title: p.title,
      content: p.content,
      problem_type: p.problem_type,
      correct_answer: p.correct_answer,
      answer_config: p.answer_config,
      auto_mark: p.auto_mark || false,
      status: 'needs_review',
      solution_text: p.solution_text,
      assets: p.assets || [],
      solution_assets: p.solution_assets || [],
    }));

    const { data: copiedProblems, error: insertError } = await supabase
      .from('problems')
      .insert(problemInserts)
      .select('id, title, problem_type, content');

    if (insertError || !copiedProblems) {
      return NextResponse.json(
        createApiErrorResponse('Failed to copy problems', 500),
        { status: 500 }
      );
    }

    // Build source-to-copy mapping using composite key matching
    // rather than relying on INSERT RETURNING order.
    const makeKey = (title: string, type: string, content: string | null) =>
      `${title}\0${type}\0${content ?? ''}`;

    const copiedByKey = new Map<string, string[]>();
    for (const cp of copiedProblems) {
      const key = makeKey(cp.title, cp.problem_type, cp.content);
      const ids = copiedByKey.get(key);
      if (ids) ids.push(cp.id);
      else copiedByKey.set(key, [cp.id]);
    }

    const sourceToNewId = new Map<number, string>();
    for (let i = 0; i < sourceProblems.length; i++) {
      const src = sourceProblems[i];
      const key = makeKey(src.title, src.problem_type, src.content);
      const ids = copiedByKey.get(key);
      if (ids && ids.length > 0) {
        sourceToNewId.set(i, ids.shift()!);
      }
    }

    // Attach tags to copied problems
    if (copy_tags && Object.keys(tagMapping).length > 0) {
      const tagInserts: {
        problem_id: string;
        tag_id: string;
        user_id: string;
      }[] = [];
      for (const [sourceIndex, newProblemId] of sourceToNewId) {
        const sourceProblem = sourceProblems[sourceIndex];
        (sourceProblem.tags || []).forEach((tag: any) => {
          const newTagId = tagMapping[tag.id];
          if (newTagId) {
            tagInserts.push({
              problem_id: newProblemId,
              tag_id: newTagId,
              user_id: user.id,
            });
          }
        });
      }

      if (tagInserts.length > 0) {
        const { error: tagLinkError } = await supabase
          .from('problem_tag')
          .insert(tagInserts);

        if (tagLinkError) {
          console.error('Failed to link tags to problems:', tagLinkError);
        }
      }
    }

    // Create new problem set (always manual, private)
    const { data: newProblemSet, error: setError } = await supabase
      .from('problem_sets')
      .insert({
        user_id: user.id,
        subject_id: target_subject_id,
        name: `${sourceProblemSet.name} (Copy)`,
        description: sourceProblemSet.description,
        sharing_level: 'private',
        is_smart: false,
        allow_copying: true,
      })
      .select('id')
      .single();

    if (setError || !newProblemSet) {
      return NextResponse.json(
        createApiErrorResponse('Failed to create copied problem set', 500),
        { status: 500 }
      );
    }

    // Link copied problems to the new set
    const copiedProblemIds = copiedProblems.map(p => p.id);
    const linkInserts = copiedProblemIds.map(id => ({
      problem_set_id: newProblemSet.id,
      problem_id: id,
      user_id: user.id,
    }));

    const { error: linkError } = await supabase
      .from('problem_set_problems')
      .insert(linkInserts);

    if (linkError) {
      console.error('Failed to link problems to copied set:', linkError);
      // Clean up: delete the empty set and orphaned copied problems
      await supabase
        .from('problem_sets')
        .delete()
        .eq('id', newProblemSet.id)
        .eq('user_id', user.id);
      await supabase
        .from('problems')
        .delete()
        .in('id', copiedProblemIds)
        .eq('user_id', user.id);

      return NextResponse.json(
        createApiErrorResponse(
          'Failed to link problems to copied set',
          500,
          linkError.message
        ),
        { status: 500 }
      );
    }

    // Record unique copy (idempotent per user per set)
    await serviceClient.rpc('record_problem_set_copy', {
      p_problem_set_id: id,
      p_user_id: user.id,
    });

    // Invalidate cache
    await Promise.all([
      revalidateUserProblemSets(user.id),
      revalidateDiscovery(),
    ]);

    return NextResponse.json(
      createApiSuccessResponse({
        problem_set_id: newProblemSet.id,
        problem_count: copiedProblems.length,
        tag_count: tagCount,
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

export const POST = withSecurity(copyProblemSet, { rateLimitType: 'api' });
