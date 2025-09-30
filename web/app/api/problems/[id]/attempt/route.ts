import { NextResponse } from 'next/server';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { id: problemId } = await params;
  const body = await req.json().catch(() => ({}));

  // Get the problem to check if auto-marking is enabled
  const { data: problem, error: problemError } = await supabase
    .from('problems')
    .select('*')
    .eq('id', problemId)
    .eq('user_id', user.id)
    .single();

  if (problemError || !problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  if (!problem.auto_mark) {
    return NextResponse.json(
      { error: 'Auto-marking is not enabled for this problem' },
      { status: 400 }
    );
  }

  const { submitted_answer } = body;

  if (submitted_answer === undefined || submitted_answer === null) {
    return NextResponse.json(
      { error: 'Submitted answer is required' },
      { status: 400 }
    );
  }

  // Compare answers based on problem type
  let isCorrect = false;

  // Extract the actual answer from the correct_answer field
  let correctAnswerValue = '';
  if (problem.correct_answer) {
    if (typeof problem.correct_answer === 'string') {
      // If it's already a string, use it directly
      correctAnswerValue = problem.correct_answer;
    } else if (
      typeof problem.correct_answer === 'object' &&
      problem.correct_answer !== null
    ) {
      // If it's an object, extract the choice or value
      correctAnswerValue =
        problem.correct_answer.choice ||
        problem.correct_answer.value ||
        String(problem.correct_answer);
    } else {
      // Fallback to string conversion
      correctAnswerValue = String(problem.correct_answer);
    }
  }

  if (problem.problem_type === 'mcq') {
    // For MCQ, case-insensitive comparison with trimmed whitespace
    const userAnswer = String(submitted_answer).trim().toLowerCase();
    const correctAnswer = correctAnswerValue.trim().toLowerCase();
    isCorrect = userAnswer === correctAnswer;
  } else if (problem.problem_type === 'short') {
    // For short answer, case-insensitive comparison with trimmed whitespace
    const userAnswer = String(submitted_answer).trim().toLowerCase();
    const correctAnswer = correctAnswerValue.trim().toLowerCase();
    isCorrect = userAnswer === correctAnswer;
  } else {
    // For extended response, we don't auto-mark
    isCorrect = false;
  }

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
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: attempt,
    is_correct: isCorrect,
  });
}
