import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { requireUser, unauthorised } from '@/lib/supabase/requireUser';
import { withSecurity } from '@/lib/security-middleware';
import {
  createApiErrorResponse,
  createApiSuccessResponse,
  handleAsyncError,
} from '@/lib/common-utils';
import { AI_CONSTANTS } from '@/lib/constants';
import { checkAndIncrementQuota } from '@/lib/usage-quota';

const RequestSchema = z.object({
  image: z.string().min(1),
  mimeType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ] as const),
});

const SYSTEM_PROMPT = `You are an expert at extracting problems from images of test papers, worksheets, and handwritten notes.

Your task:
1. Extract the problem statement faithfully. Do NOT solve the problem or provide answers.
2. Use $...$ for inline math and $$...$$ on its own line for display math. Use LaTeX notation for all mathematical expressions.
3. Classify the problem:
   - "mcq" if it has labeled choices (A, B, C, D or similar)
   - "short" if it expects a brief answer (number, word, short phrase)
   - "extended" if it requires a longer response, proof, or explanation
4. For MCQ problems, extract each choice with its label and text. MCQ choice text must be plain text only -- do NOT use $...$ or any LaTeX/math notation in mcq_choices, since those fields do not support rich text rendering.
5. Generate a concise title (max 50 characters) summarizing the problem.
6. Preserve the original language of the problem.
7. Set confidence fields honestly:
   - problem_type_confidence: how sure you are about the classification
   - content_quality: "clear" if fully legible, "partially_unclear" if some parts are hard to read, "unclear" if mostly illegible
   - has_math: whether the problem contains mathematical notation
   - warnings: list any issues (unclear handwriting, non-problem content, partial image, etc.)`;

const RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    problem_type: {
      type: 'string' as const,
      enum: ['mcq', 'short', 'extended'],
    },
    title: { type: 'string' as const },
    content: { type: 'string' as const },
    mcq_choices: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          id: { type: 'string' as const },
          text: { type: 'string' as const },
        },
        required: ['id', 'text'] as const,
      },
    },
    confidence: {
      type: 'object' as const,
      properties: {
        problem_type_confidence: {
          type: 'string' as const,
          enum: ['high', 'medium', 'low'],
        },
        content_quality: {
          type: 'string' as const,
          enum: ['clear', 'partially_unclear', 'unclear'],
        },
        has_math: { type: 'boolean' as const },
        warnings: {
          type: 'array' as const,
          items: { type: 'string' as const },
        },
      },
      required: [
        'problem_type_confidence',
        'content_quality',
        'has_math',
      ] as const,
    },
  },
  required: ['problem_type', 'title', 'content', 'confidence'] as const,
};

async function extractProblem(req: Request) {
  const { user } = await requireUser();
  if (!user) return unauthorised();

  // Check daily quota before proceeding (RPC handles per-user overrides)
  const quota = await checkAndIncrementQuota(user.id);

  if (!quota.allowed) {
    return NextResponse.json(
      createApiErrorResponse('Daily extraction limit reached', 429, {
        quota: {
          used: quota.current_usage,
          limit: quota.daily_limit,
          remaining: 0,
        },
      }),
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      createApiErrorResponse('AI extraction service not configured', 500),
      { status: 500 }
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

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      createApiErrorResponse('Invalid request', 400, parsed.error.flatten()),
      { status: 400 }
    );
  }

  const { image, mimeType } = parsed.data;

  // Estimate decoded image size from base64 length
  const estimatedSize = Math.ceil((image.length * 3) / 4);
  if (estimatedSize > AI_CONSTANTS.EXTRACTION.MAX_IMAGE_SIZE) {
    return NextResponse.json(
      createApiErrorResponse('Image too large. Maximum size is 5MB.', 400),
      { status: 400 }
    );
  }

  try {
    const genai = new GoogleGenAI({ apiKey });

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: image,
              },
            },
            {
              text: 'Extract the problem from this image. Follow the system instructions carefully.',
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
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

    const extraction = JSON.parse(text);
    return NextResponse.json(
      createApiSuccessResponse({
        ...extraction,
        quota: {
          used: quota.current_usage,
          limit: quota.daily_limit,
          remaining: quota.remaining,
        },
      })
    );
  } catch (error) {
    const { message, status } = handleAsyncError(error);
    return NextResponse.json(createApiErrorResponse(message, status), {
      status,
    });
  }
}

export const POST = withSecurity(extractProblem, {
  rateLimitType: 'custom',
  customRateLimit: AI_CONSTANTS.EXTRACTION.RATE_LIMIT,
});
