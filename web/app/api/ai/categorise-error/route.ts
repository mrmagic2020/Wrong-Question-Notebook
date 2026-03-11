import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
  isValidUuid,
} from '@/lib/common-utils';
import { ERROR_MESSAGES } from '@/lib/constants';
import { createServiceClient } from '@/lib/supabase-utils';

const RequestSchema = z.object({
  attempt_id: z.uuid(),
  problem_id: z.uuid(),
  subject_id: z.uuid(),
  user_id: z.uuid(),
});

const BROAD_CATEGORIES = [
  'conceptual_misunderstanding',
  'procedural_error',
  'knowledge_gap',
  'misread_question',
  'careless_mistake',
  'time_pressure',
  'incomplete_answer',
] as const;

const RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    broad_category: {
      type: 'string' as const,
      enum: [...BROAD_CATEGORIES],
    },
    granular_tag: { type: 'string' as const },
    topic_label: { type: 'string' as const },
    confidence: { type: 'number' as const },
    reasoning: { type: 'string' as const },
  },
  required: [
    'broad_category',
    'granular_tag',
    'topic_label',
    'confidence',
    'reasoning',
  ] as const,
};

function buildSystemPrompt(
  problem: {
    title: string;
    content: string;
    problem_type: string;
    correct_answer: string | null;
  },
  subjectName: string
) {
  return `You are an expert educational diagnostician. Your task is to analyse a student's error on a problem and categorise it.

# Context
- Subject: ${subjectName}
- Problem type: ${problem.problem_type}

# Broad categories (pick exactly one)
- conceptual_misunderstanding: The student does not understand the underlying concept
- procedural_error: The student understands the concept but made a mistake in the procedure/steps
- knowledge_gap: The student lacks specific knowledge needed (formula, fact, definition)
- misread_question: The student misinterpreted or overlooked part of the question
- careless_mistake: The student knew the material but made a silly arithmetic/transcription error
- time_pressure: The answer is rushed/incomplete due to time constraints
- incomplete_answer: The student's reasoning was on track but the answer is partial or missing steps

# Instructions
1. Compare the student's submitted answer to the correct answer.
2. Consider the student's self-reported cause and reflection notes if provided.
3. Generate a specific, descriptive granular_tag (e.g. "mixed up sine and cosine in right triangles", "forgot to distribute the negative sign").
4. Generate a consistent, reusable topic_label for clustering related problems (e.g. "Trigonometric Ratios", "Polynomial Factoring"). Use Title Case. Keep it concise (2-5 words). This label should be reusable across many problems in the same topic area.
5. If previous attempts are provided, look for recurring error patterns.
6. Set confidence between 0 and 1 based on how certain you are about the categorisation.
7. Provide brief reasoning explaining your categorisation.`;
}

function buildUserPrompt(
  problem: {
    title: string;
    content: string;
    correct_answer: string | null;
  },
  attempt: {
    submitted_answer: unknown;
    is_correct: boolean | null;
    cause: string | null;
    reflection_notes: string | null;
    confidence: number | null;
  },
  previousAttempts: Array<{
    submitted_answer: unknown;
    is_correct: boolean | null;
    cause: string | null;
    created_at: string;
  }>
) {
  let prompt = `# Problem
Title: ${problem.title}
Content: ${problem.content || '(no content)'}
Correct answer: ${problem.correct_answer || '(not provided)'}

# Student's Attempt
Submitted answer: ${JSON.stringify(attempt.submitted_answer)}
Was correct: ${attempt.is_correct}
Self-reported cause: ${attempt.cause || '(not provided)'}
Reflection notes: ${attempt.reflection_notes || '(not provided)'}
Confidence level: ${attempt.confidence ?? '(not provided)'}`;

  if (previousAttempts.length > 0) {
    prompt += '\n\n# Previous Attempts (most recent first)';
    for (const prev of previousAttempts) {
      prompt += `\n- Answer: ${JSON.stringify(prev.submitted_answer)}, Correct: ${prev.is_correct}, Cause: ${prev.cause || 'N/A'}, Date: ${prev.created_at}`;
    }
  }

  prompt +=
    '\n\nAnalyse the error and provide your categorisation in the required JSON format.';

  return prompt;
}

export async function POST(req: Request) {
  // Validate service-to-service secret
  const secret = req.headers.get('x-categorisation-secret');
  if (!secret || secret !== process.env.CATEGORISATION_SECRET) {
    return NextResponse.json(
      createApiErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401),
      { status: 401 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      createApiErrorResponse('AI categorisation service not configured', 500),
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      createApiErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400),
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(body);
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

  const { attempt_id, problem_id, subject_id, user_id } = parsed.data;

  try {
    const serviceClient = createServiceClient();

    // Fetch all required data in parallel
    const [attemptResult, problemResult, subjectResult, previousResult] =
      await Promise.all([
        serviceClient
          .from('attempts')
          .select('*')
          .eq('id', attempt_id)
          .eq('user_id', user_id)
          .single(),
        serviceClient
          .from('problems')
          .select('title, content, problem_type, correct_answer, subject_id')
          .eq('id', problem_id)
          .single(),
        serviceClient
          .from('subjects')
          .select('name')
          .eq('id', subject_id)
          .single(),
        serviceClient
          .from('attempts')
          .select('submitted_answer, is_correct, cause, created_at')
          .eq('problem_id', problem_id)
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

    if (attemptResult.error || !attemptResult.data) {
      return NextResponse.json(
        createApiErrorResponse('Attempt not found', 404),
        { status: 404 }
      );
    }

    if (problemResult.error || !problemResult.data) {
      return NextResponse.json(
        createApiErrorResponse('Problem not found', 404),
        { status: 404 }
      );
    }

    if (subjectResult.error || !subjectResult.data) {
      return NextResponse.json(
        createApiErrorResponse('Subject not found', 404),
        { status: 404 }
      );
    }

    // Check if categorisation already exists for this attempt
    const { data: existing } = await serviceClient
      .from('error_categorisations')
      .select('id')
      .eq('attempt_id', attempt_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        createApiSuccessResponse({ already_exists: true })
      );
    }

    const attempt = attemptResult.data;
    const problem = problemResult.data;
    const subject = subjectResult.data;
    const previousAttempts = previousResult.data ?? [];

    // Build prompt and call Gemini
    const systemPrompt = buildSystemPrompt(problem, subject.name);
    const userPrompt = buildUserPrompt(problem, attempt, previousAttempts);

    const genai = new GoogleGenAI({ apiKey });

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        createApiErrorResponse('AI returned empty response', 500),
        { status: 500 }
      );
    }

    const result = JSON.parse(text);

    // Insert categorisation into database
    const { data: categorisation, error: insertError } = await serviceClient
      .from('error_categorisations')
      .insert({
        attempt_id,
        problem_id,
        subject_id,
        user_id,
        broad_category: result.broad_category,
        granular_tag: result.granular_tag,
        topic_label: result.topic_label,
        topic_label_normalised: result.topic_label.toLowerCase().trim(),
        ai_confidence: result.confidence,
        ai_reasoning: result.reasoning,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        createApiErrorResponse(
          ERROR_MESSAGES.DATABASE_ERROR,
          500,
          insertError.message
        ),
        { status: 500 }
      );
    }

    return NextResponse.json(createApiSuccessResponse(categorisation));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

async function getCategorisation(req: Request) {
  const { user, supabase } = await requireUser();
  if (!user) return unauthorised();

  const { searchParams } = new URL(req.url);
  const attemptId = searchParams.get('attempt_id');

  if (!attemptId || !isValidUuid(attemptId)) {
    return NextResponse.json(
      createApiErrorResponse('attempt_id is required', 400),
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('error_categorisations')
      .select('*')
      .eq('attempt_id', attemptId)
      .eq('user_id', user.id)
      .maybeSingle();

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

    return NextResponse.json(createApiSuccessResponse(data));
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const GET = withSecurity(getCategorisation, {
  rateLimitType: 'readOnly',
});
