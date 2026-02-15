import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import { CreateSubjectDto } from '@/lib/schemas';
import { revalidateUserSubjects } from '@/lib/cache-invalidation';

// Cache configuration for this route
export const revalidate = 600; // 10 minutes

async function getSubjects() {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  try {
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (subjectsError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          subjectsError.message
        ),
        { status: 500 }
      );
    }

    // Enrich with problem_count and last_activity
    const enriched = await Promise.all(
      (subjects || []).map(async subject => {
        // Count problems
        const { count } = await supabase
          .from('problems')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', subject.id);

        // Get most recent last_reviewed_date
        const { data: lastReviewed } = await supabase
          .from('problems')
          .select('last_reviewed_date')
          .eq('subject_id', subject.id)
          .order('last_reviewed_date', { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        return {
          ...subject,
          problem_count: count ?? 0,
          last_activity: lastReviewed?.last_reviewed_date ?? null,
        };
      })
    );

    return NextResponse.json(createApiSuccessResponse(enriched));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getSubjects, { rateLimitType: 'readOnly' });

async function createSubject(req: Request) {
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

  const parsed = CreateSubjectDto.safeParse(body);
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

  try {
    const { data, error } = await supabase
      .from('subjects')
      .insert({ user_id: user.id, ...parsed.data })
      .select()
      .single();

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

    // Invalidate cache after successful creation
    await revalidateUserSubjects(user.id);

    return NextResponse.json(createApiSuccessResponse(data), { status: 201 });
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(createSubject, { rateLimitType: 'api' });
