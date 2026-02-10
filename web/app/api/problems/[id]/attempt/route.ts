import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import { revalidateProblemAndSubject } from '@/lib/cache-invalidation';
import { markAnswer } from '@/lib/answer-marking';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id: problemId } = await params;
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

  try {
    // Get the problem to check if auto-marking is enabled
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('*')
      .eq('id', problemId)
      .single();

    if (problemError || !problem) {
      return NextResponse.json(
        createApiErrorResponse(ERROR_MESSAGES.NOT_FOUND, 404),
        { status: 404 }
      );
    }

    if (!problem.auto_mark) {
      return NextResponse.json(
        createApiErrorResponse(
          'Auto-marking is not enabled for this problem',
          400
        ),
        { status: 400 }
      );
    }

    const { submitted_answer } = body;

    if (submitted_answer === undefined || submitted_answer === null) {
      return NextResponse.json(
        createApiErrorResponse('Submitted answer is required', 400),
        { status: 400 }
      );
    }

    // Compare answers using the marking utility
    const isCorrect = markAnswer(
      problem.problem_type,
      submitted_answer,
      problem.answer_config ?? null,
      typeof problem.correct_answer === 'string'
        ? problem.correct_answer
        : problem.correct_answer
          ? String(problem.correct_answer)
          : null
    );

    // Create attempt record
    const attemptData = {
      problem_id: problemId,
      submitted_answer,
      is_correct: isCorrect,
      user_id: user.id,
    };

    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .insert(attemptData)
      .select()
      .single();

    if (attemptError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          attemptError.message
        ),
        { status: 500 }
      );
    }

    // Invalidate cache after successful attempt creation - only the specific problem and its subject
    await revalidateProblemAndSubject(problemId, problem.subject_id);

    return NextResponse.json(
      createApiSuccessResponse({
        data: attempt,
        is_correct: isCorrect,
      })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}
