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
import { revalidateUserSubjects } from '@/lib/cache-invalidation';
import { z } from 'zod';

const CopyProblemBody = z.object({
  problem_id: z.uuid(),
  target_subject_id: z.uuid(),
  copy_tags: z.boolean().default(true),
});

async function copyProblem(
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

  const parsed = CopyProblemBody.safeParse(body);
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

  const { problem_id, target_subject_id, copy_tags } = parsed.data;

  try {
    const serviceClient = createServiceClient();

    // Fetch the source problem set
    const { data: sourceProblemSet, error: sourceError } = await serviceClient
      .from('problem_sets')
      .select('*')
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

    // Verify the problem belongs to this set
    if (sourceProblemSet.is_smart && sourceProblemSet.filter_config) {
      // For smart sets, resolve the current matching problems via filter_config
      const filterConfig: FilterConfig = {
        tag_ids: sourceProblemSet.filter_config.tag_ids ?? [],
        statuses: sourceProblemSet.filter_config.statuses ?? [],
        problem_types: sourceProblemSet.filter_config.problem_types ?? [],
        days_since_review:
          sourceProblemSet.filter_config.days_since_review ?? null,
        include_never_reviewed:
          sourceProblemSet.filter_config.include_never_reviewed ?? true,
      };
      const smartProblems = await getFilteredProblems(
        serviceClient,
        sourceProblemSet.user_id,
        sourceProblemSet.subject_id,
        filterConfig,
        sourceProblemSet.user_id
      );
      const smartProblemIds = new Set(smartProblems.map((p: any) => p.id));

      if (!smartProblemIds.has(problem_id)) {
        return NextResponse.json(
          createApiErrorResponse(
            'Problem does not belong to this problem set',
            400
          ),
          { status: 400 }
        );
      }
    } else if (!sourceProblemSet.is_smart) {
      // For manual sets, check the junction table
      const { data: linkCheck } = await serviceClient
        .from('problem_set_problems')
        .select('problem_id')
        .eq('problem_set_id', id)
        .eq('problem_id', problem_id)
        .single();

      if (!linkCheck) {
        return NextResponse.json(
          createApiErrorResponse(
            'Problem does not belong to this problem set',
            400
          ),
          { status: 400 }
        );
      }
    }

    // Fetch the source problem with tags
    const { data: sourceProblem, error: problemError } = await serviceClient
      .from('problems')
      .select(
        `
        id, title, content, problem_type, correct_answer,
        answer_config, auto_mark, status, created_at,
        solution_text, assets, solution_assets,
        problem_tag(tags:tag_id(id, name))
      `
      )
      .eq('id', problem_id)
      .single();

    if (problemError || !sourceProblem) {
      return NextResponse.json(
        createApiErrorResponse('Problem not found', 404),
        { status: 404 }
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

    // Handle tag mapping
    const sourceTags =
      (sourceProblem as any).problem_tag
        ?.map((pt: any) => pt.tags)
        .filter(Boolean) || [];
    const tagMapping: Record<string, string> = {};
    let tagCount = 0;

    if (copy_tags && sourceTags.length > 0) {
      const tagNames = sourceTags.map((t: any) => t.name);

      // Check which tags already exist in target subject
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

      for (const tag of sourceTags) {
        if (!existingByName.has(tag.name)) {
          missingTags.push({
            name: tag.name,
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
      for (const tag of sourceTags) {
        const newTagId = existingByName.get(tag.name);
        if (newTagId) {
          tagMapping[tag.id] = newTagId;
        }
      }
      tagCount = Object.keys(tagMapping).length;
    }

    // Insert the copied problem
    const { data: copiedProblem, error: insertError } = await supabase
      .from('problems')
      .insert({
        user_id: user.id,
        subject_id: target_subject_id,
        title: sourceProblem.title,
        content: sourceProblem.content,
        problem_type: sourceProblem.problem_type,
        correct_answer: sourceProblem.correct_answer,
        answer_config: sourceProblem.answer_config,
        auto_mark: sourceProblem.auto_mark || false,
        status: 'needs_review',
        solution_text: sourceProblem.solution_text,
        assets: sourceProblem.assets || [],
        solution_assets: sourceProblem.solution_assets || [],
      })
      .select('id')
      .single();

    if (insertError || !copiedProblem) {
      return NextResponse.json(
        createApiErrorResponse('Failed to copy problem', 500),
        { status: 500 }
      );
    }

    // Attach tags to copied problem
    if (copy_tags && Object.keys(tagMapping).length > 0) {
      const tagInserts = sourceTags
        .map((tag: any) => {
          const newTagId = tagMapping[tag.id];
          if (!newTagId) return null;
          return {
            problem_id: copiedProblem.id,
            tag_id: newTagId,
            user_id: user.id,
          };
        })
        .filter(Boolean);

      if (tagInserts.length > 0) {
        const { error: tagLinkError } = await supabase
          .from('problem_tag')
          .insert(tagInserts);

        if (tagLinkError) {
          console.error('Failed to link tags to problem:', tagLinkError);
        }
      }
    }

    // Invalidate cache
    await revalidateUserSubjects(user.id);

    return NextResponse.json(
      createApiSuccessResponse({
        problem_id: copiedProblem.id,
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

export const POST = withSecurity(copyProblem, { rateLimitType: 'api' });
