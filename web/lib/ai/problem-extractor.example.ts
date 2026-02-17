/**
 * Example implementation of problem extraction using Gemini 2.5 Flash
 * This file demonstrates how to use the schema with Google's Generative AI SDK
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ProblemExtractionSchema,
  ProblemExtractionResult,
  PROBLEM_EXTRACTION_PROMPT,
} from './problem-extraction-schema';

/**
 * Extract problem data from an image using Gemini 2.5 Flash
 */
export async function extractProblemFromImage(
  imageData: string | Buffer,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<ProblemExtractionResult> {
  // Initialize the Gemini API client
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  // Use Gemini 2.5 Flash for cost efficiency
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: ProblemExtractionSchema,
    },
  });

  // Convert image to base64 if it's a Buffer
  const imageBase64 =
    typeof imageData === 'string'
      ? imageData
      : imageData.toString('base64');

  // Send the image and prompt to Gemini
  const result = await model.generateContent([
    PROBLEM_EXTRACTION_PROMPT,
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const response = result.response;
  const extractedData = JSON.parse(
    response.text()
  ) as ProblemExtractionResult;

  return extractedData;
}

/**
 * Example usage in a Next.js API route
 *
 * File: /web/app/api/ai/extract-problem/route.ts
 */
export async function exampleApiRoute() {
  // This is pseudocode showing how you'd use it in an API route
  /*
  import { NextRequest, NextResponse } from 'next/server';
  import { extractProblemFromImage } from '@/lib/ai/problem-extractor.example';
  import { createClient } from '@/lib/supabase/server';

  export async function POST(req: NextRequest) {
    try {
      // 1. Verify authentication
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 2. Check daily usage limit (3-5 free uses per day)
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('ai_extraction_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today);

      const DAILY_LIMIT = 5;
      if (count && count >= DAILY_LIMIT) {
        return NextResponse.json(
          { error: 'Daily extraction limit reached' },
          { status: 429 }
        );
      }

      // 3. Get the uploaded image
      const formData = await req.formData();
      const imageFile = formData.get('image') as File;

      if (!imageFile) {
        return NextResponse.json(
          { error: 'No image provided' },
          { status: 400 }
        );
      }

      // 4. Convert to buffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 5. Extract problem data using Gemini
      const extractedData = await extractProblemFromImage(
        buffer,
        imageFile.type as any
      );

      // 6. Log usage
      await supabase.from('ai_extraction_usage').insert({
        user_id: user.id,
        created_at: new Date().toISOString(),
      });

      // 7. Return extracted data to the frontend
      return NextResponse.json(extractedData);
    } catch (error) {
      console.error('Problem extraction error:', error);
      return NextResponse.json(
        { error: 'Extraction failed' },
        { status: 500 }
      );
    }
  }
  */
}

/**
 * Example test cases
 */
export const exampleExtractionResults = {
  // MCQ example with all fields detected
  mcqComplete: {
    problem_type: 'mcq',
    title: 'Quadratic equation roots',
    content:
      'What are the roots of the equation $$x^2 - 5x + 6 = 0$$?',
    answer_config: {
      type: 'mcq',
      choices: [
        { id: 'A', text: '$x = 2$ and $x = 3$' },
        { id: 'B', text: '$x = 1$ and $x = 6$' },
        { id: 'C', text: '$x = -2$ and $x = -3$' },
        { id: 'D', text: 'No real roots' },
      ],
      correct_choice_id: 'A',
    },
    extraction_confidence: {
      problem_type_confidence: 'high',
      content_quality: 'clear',
      has_math_notation: true,
      warnings: [],
    },
  },

  // MCQ without visible answer (student hasn't marked it yet)
  mcqNoAnswer: {
    problem_type: 'mcq',
    title: 'Python list method',
    content:
      'Which method is used to add an element to the end of a Python list?',
    answer_config: {
      type: 'mcq',
      choices: [
        { id: 'A', text: 'list.add()' },
        { id: 'B', text: 'list.append()' },
        { id: 'C', text: 'list.insert()' },
        { id: 'D', text: 'list.push()' },
      ],
      correct_choice_id: null, // No answer marked in the image
    },
    extraction_confidence: {
      problem_type_confidence: 'high',
      content_quality: 'clear',
      has_math_notation: false,
      warnings: [],
    },
  },

  // SHORT answer (numeric) with answer visible
  shortNumeric: {
    problem_type: 'short',
    title: 'Calculate velocity',
    content:
      'A car travels 150 meters in 5 seconds. Calculate its average velocity.',
    answer_config: {
      type: 'short',
      mode: 'numeric',
      numeric_config: {
        correct_value: 30,
        tolerance: 0.1,
        unit: 'm/s',
      },
    },
    extraction_confidence: {
      problem_type_confidence: 'high',
      content_quality: 'clear',
      has_math_notation: false,
      warnings: [],
    },
  },

  // SHORT answer (text) with multiple acceptable answers
  shortText: {
    problem_type: 'short',
    title: 'Capital of France',
    content: 'What is the capital city of France?',
    answer_config: {
      type: 'short',
      mode: 'text',
      acceptable_answers: ['Paris', 'paris'],
    },
    extraction_confidence: {
      problem_type_confidence: 'medium',
      content_quality: 'clear',
      has_math_notation: false,
      warnings: [],
    },
  },

  // EXTENDED answer (no auto-marking)
  extended: {
    problem_type: 'extended',
    title: 'Photosynthesis process',
    content:
      'Explain the process of photosynthesis, including the roles of chlorophyll, sunlight, water, and carbon dioxide. Describe both the light-dependent and light-independent reactions.',
    answer_config: null, // Extended answers are not auto-marked
    extraction_confidence: {
      problem_type_confidence: 'high',
      content_quality: 'clear',
      has_math_notation: false,
      warnings: [],
    },
  },

  // Example with unclear handwriting
  unclearHandwriting: {
    problem_type: 'short',
    title: 'Unclear problem',
    content: 'Solve for x: [unclear equation]',
    answer_config: null,
    extraction_confidence: {
      problem_type_confidence: 'low',
      content_quality: 'unclear',
      has_math_notation: true,
      warnings: [
        'Handwriting is difficult to read',
        'Mathematical notation may be incorrect',
        'Manual review recommended',
      ],
    },
  },
};
