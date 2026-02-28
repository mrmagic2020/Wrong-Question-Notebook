import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import { OnboardingStatus } from '@/lib/types';

async function getOnboardingStatus() {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  try {
    const [subjects, problems, reviewed, firstSubject, firstProblem] =
      await Promise.all([
        supabase
          .from('subjects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('problems')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('problems')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('last_reviewed_date', 'is', null),
        supabase
          .from('subjects')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('problems')
          .select('id, subject_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

    if (subjects.error || problems.error || reviewed.error) {
      const errMsg =
        subjects.error?.message ||
        problems.error?.message ||
        reviewed.error?.message;
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.DATABASE_ERROR, 500, errMsg),
        { status: 500 }
      );
    }

    const status: OnboardingStatus = {
      hasSubject: (subjects.count ?? 0) > 0,
      hasProblem: (problems.count ?? 0) > 0,
      hasReviewed: (reviewed.count ?? 0) > 0,
      firstSubjectId: firstSubject.data?.id ?? null,
      firstProblemId: firstProblem.data?.id ?? null,
      firstProblemSubjectId: firstProblem.data?.subject_id ?? null,
    };

    return NextResponse.json(createApiSuccessResponse(status));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getOnboardingStatus, {
  rateLimitType: 'readOnly',
});
