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

IMPORTANT: Your output is a JSON string. All backslashes in LaTeX must be double-escaped (e.g. \\\\frac, \\\\text, \\\\sqrt) so that the parsed JSON produces valid LaTeX with single backslashes.

# Core rules
1. Extract the problem statement faithfully. Do NOT solve the problem or provide answers.
2. Preserve the original language of the problem.
3. Classify the problem:
   - "mcq" if it has labeled choices (A, B, C, D or similar)
   - "short" if it expects a brief answer (number, word, short phrase)
   - "extended" if it requires a longer response, proof, or explanation

# Title rules
- Generate a concise, descriptive title (max 50 characters) summarizing the problem topic.
- The title MUST be in Title Case (capitalize the first letter of major words).
- The title MUST NOT contain any math notation ($...$, $$...$$). Use plain-text descriptions instead. For example, use "Quadratic Equation Roots" instead of "Roots of $x^2 + 1 = 0$".
- Strip any original problem numbers (e.g. "Q3", "Problem 12") from the title.

# Math formatting rules
- Use $...$ for inline math and $$...$$ on its own line for display math (block equations).
- ALL numeric values, variables, and mathematical expressions MUST be wrapped in inline math $...$. For example: "the mass is $5 \\\\text{kg}$", not "the mass is 5 kg".
- Use \\\\text{...} inside math delimiters to enclose:
  - Units: $10 \\\\text{m/s}$, $25 \\\\text{°C}$
  - Chemical formulae: $\\\\text{NaOH}$, $\\\\text{H}_2\\\\text{O}$
  - Short textual labels within equations: $v_{\\\\text{max}}$
- Use display math ($$...$$) for standalone equations, systems of equations, or any expression that benefits from being on its own line.
- Use inline math ($...$) for values, variables, and short expressions embedded in prose.

# MCQ choice rules
- Extract each choice with its label (A, B, C, D, etc.) as "id" and the choice content as "text".
- MCQ choice text MUST only use inline math ($...$). Never use display math ($$...$$) in choices.
- Apply the same numeric/math formatting rules: all numbers, variables, and expressions in choices must be wrapped in $...$.

# Multi-part problems
- If the image contains sub-parts (a, b, c or i, ii, iii), include all sub-parts in the content field as a single problem.
- Use line breaks and label each sub-part clearly, e.g. "(a) ...", "(b) ...".

# Visual content (suggest_image_asset)
- Set suggest_image_asset to true ONLY when the image contains diagrams, graphs, tables, geometric figures, circuit diagrams, or other visual elements that cannot be faithfully represented as text.
- When suggest_image_asset is true, do NOT attempt to describe the visual content in text. Simply reference it naturally (e.g. "as shown in the figure" or "from the table above") and extract only the textual parts of the problem.
- When suggest_image_asset is false, the image is purely text-based and the extracted content is self-contained.
- Default to false for problems that are entirely text and equations.

# Confidence fields
Set these honestly:
- problem_type_confidence: how sure you are about the classification
- content_quality: "clear" if fully legible, "partially_unclear" if some parts are hard to read, "unclear" if mostly illegible
- has_math: whether the problem contains mathematical notation
- warnings: list any issues (unclear handwriting, non-problem content, partial image, cropped content, referenced figure not fully visible, etc.)`;

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
    suggest_image_asset: { type: 'boolean' as const },
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
  required: [
    'problem_type',
    'title',
    'content',
    'suggest_image_asset',
    'confidence',
  ] as const,
};

async function extractProblem(req: Request) {
  const { user } = await requireUser();
  if (!user) return unauthorised();

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

  // Check daily quota only after all validation passes (RPC handles per-user overrides)
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
