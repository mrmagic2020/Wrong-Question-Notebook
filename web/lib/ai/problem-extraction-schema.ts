/**
 * JSON Schema for Gemini structured output when extracting problem data from images.
 * This schema defines the expected structure for auto-filling problem forms.
 */

export const ProblemExtractionSchema = {
  type: 'object',
  properties: {
    // Problem type detection (required)
    problem_type: {
      type: 'string',
      enum: ['mcq', 'short', 'extended'],
      description:
        'The detected problem type. MCQ if lettered/numbered choices are visible, SHORT if a blank/box for answer, EXTENDED for essay/paragraph responses.',
    },

    // Auto-generated title (required)
    title: {
      type: 'string',
      description:
        'A concise title summarizing the problem (1-50 characters). Generate from the first sentence or topic.',
    },

    // Problem statement (required)
    content: {
      type: 'string',
      description:
        'The full problem statement/question text. Use LaTeX notation for math (e.g., $x^2$, $$\\frac{a}{b}$$). Include all visible problem text.',
    },

    // Answer configuration (conditional on problem_type)
    answer_config: {
      type: 'object',
      description:
        'Answer configuration. Only populate if the answer or choices are clearly visible in the image.',
      anyOf: [
        {
          // MCQ answer config
          type: 'object',
          properties: {
            type: {
              type: 'string',
              const: 'mcq',
            },
            choices: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description:
                      'Choice identifier (A, B, C, D or 1, 2, 3, 4)',
                  },
                  text: {
                    type: 'string',
                    description:
                      'Choice text. Use LaTeX for math. Max 200 chars.',
                  },
                },
                required: ['id', 'text'],
              },
              minItems: 2,
              maxItems: 10,
              description: 'All visible answer choices.',
            },
            correct_choice_id: {
              type: 'string',
              description:
                'ID of the correct choice (only if marked/circled in the image). Omit if unknown.',
              nullable: true,
            },
          },
          required: ['type', 'choices'],
        },
        {
          // SHORT answer (text mode)
          type: 'object',
          properties: {
            type: {
              type: 'string',
              const: 'short',
            },
            mode: {
              type: 'string',
              const: 'text',
            },
            acceptable_answers: {
              type: 'array',
              items: {
                type: 'string',
              },
              minItems: 1,
              maxItems: 20,
              description:
                'List of acceptable text answers (if visible in image). Include common variations.',
            },
          },
          required: ['type', 'mode', 'acceptable_answers'],
        },
        {
          // SHORT answer (numeric mode)
          type: 'object',
          properties: {
            type: {
              type: 'string',
              const: 'short',
            },
            mode: {
              type: 'string',
              const: 'numeric',
            },
            numeric_config: {
              type: 'object',
              properties: {
                correct_value: {
                  type: 'number',
                  description: 'The numeric answer (if visible in image).',
                },
                tolerance: {
                  type: 'number',
                  description:
                    'Acceptable margin of error. Default to 0.01 if not specified.',
                },
                unit: {
                  type: 'string',
                  description:
                    'Unit of measurement (e.g., "m", "kg", "°C"). Omit if unitless.',
                  nullable: true,
                },
              },
              required: ['correct_value', 'tolerance'],
            },
          },
          required: ['type', 'mode', 'numeric_config'],
        },
      ],
      nullable: true,
    },

    // Extraction confidence (optional but useful)
    extraction_confidence: {
      type: 'object',
      properties: {
        problem_type_confidence: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description:
            'Confidence in problem type detection. High if unambiguous visual cues (e.g., lettered choices for MCQ).',
        },
        content_quality: {
          type: 'string',
          enum: ['clear', 'partially_unclear', 'unclear'],
          description:
            'Quality of text extraction. Mark unclear if handwriting is illegible or image is blurry.',
        },
        has_math_notation: {
          type: 'boolean',
          description: 'Whether the problem contains mathematical notation.',
        },
        warnings: {
          type: 'array',
          items: {
            type: 'string',
          },
          description:
            'Any warnings for the user (e.g., "Handwriting unclear", "Math symbols may be incorrect", "Answer not visible").',
        },
      },
      required: [
        'problem_type_confidence',
        'content_quality',
        'has_math_notation',
      ],
    },
  },
  required: ['problem_type', 'title', 'content'],
};

/**
 * TypeScript type matching the schema above
 */
export interface ProblemExtractionResult {
  problem_type: 'mcq' | 'short' | 'extended';
  title: string;
  content: string;
  answer_config?:
    | {
        type: 'mcq';
        choices: Array<{ id: string; text: string }>;
        correct_choice_id?: string | null;
      }
    | {
        type: 'short';
        mode: 'text';
        acceptable_answers: string[];
      }
    | {
        type: 'short';
        mode: 'numeric';
        numeric_config: {
          correct_value: number;
          tolerance: number;
          unit?: string | null;
        };
      }
    | null;
  extraction_confidence?: {
    problem_type_confidence: 'high' | 'medium' | 'low';
    content_quality: 'clear' | 'partially_unclear' | 'unclear';
    has_math_notation: boolean;
    warnings?: string[];
  };
}

/**
 * Example prompt for Gemini API
 */
export const PROBLEM_EXTRACTION_PROMPT = `You are analyzing an image of an academic problem/question from a student's test, homework, or textbook.

Extract the following information:

1. **Problem Type**: Determine if this is:
   - MCQ (multiple choice): Visible lettered/numbered answer options
   - SHORT: Fill-in-the-blank, short answer, or single numeric answer
   - EXTENDED: Essay, paragraph, or long-form written response

2. **Title**: Generate a brief, descriptive title (1-50 chars) from the problem content.

3. **Content**: Extract the full problem statement.
   - For mathematical notation, use LaTeX: inline math with $...$ and display math with $$...$$
   - Example: "Solve for $x$ in $$x^2 + 2x - 3 = 0$$"
   - Preserve all problem text exactly as shown

4. **Answer Configuration** (only if visible):
   - For MCQ: Extract all choices with their IDs (A/B/C/D or 1/2/3/4) and text. If an answer is marked/circled, include correct_choice_id.
   - For SHORT: If the answer is visible, extract it. Determine if it's text-based or numeric.
   - For EXTENDED: Omit answer_config (no auto-marking for essays)

5. **Confidence**: Assess extraction quality and flag any issues.

Important guidelines:
- Only extract what you can see clearly in the image
- If the answer is not visible or marked, omit answer_config entirely
- Flag any unclear handwriting, blurry text, or ambiguous notation in warnings
- Use LaTeX notation for all mathematical expressions
- Be conservative: if unsure about problem type, default to EXTENDED`;
