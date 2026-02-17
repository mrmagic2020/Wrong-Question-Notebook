# AI Problem Extraction

Auto-fill problem forms using Gemini 2.5 Flash vision model.

## Overview

This feature allows students to upload a photo/screenshot of a problem, and the AI automatically:
- Detects the problem type (MCQ, SHORT, EXTENDED)
- Extracts the problem content and title
- Populates answer choices (for MCQ) or answer config (for SHORT)
- Flags any unclear or ambiguous content

## Files in this directory

| File | Purpose |
|------|---------|
| `problem-extraction-schema.ts` | JSON Schema and TypeScript types for Gemini structured output |
| `problem-extractor.example.ts` | Example implementation and test cases |
| `usage-tracking.sql` | Database schema for tracking daily usage limits |
| `README.md` | This file |

## Cost & Free Tier

**Model:** Gemini 2.5 Flash via Google AI Studio
**Pricing:** $0.15/$0.60 per 1M tokens (input/output)
**Free tier:** 1,000 requests/day (enough for 200+ daily active users with 5 uses each)
**Cost if exceeding free tier:** ~$0.00035 per extraction ≈ $2.63/month for 50 students × 5 uses/day

## Setup

### 1. Get a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with a Google account
3. Click "Get API Key"
4. Copy the key

### 2. Add to environment variables

Add to your `.env.local`:

```bash
GEMINI_API_KEY=your_api_key_here
```

### 3. Install the Gemini SDK

```bash
npm install @google/generative-ai
```

### 4. Set up the database table

Run the SQL script in your Supabase SQL editor:

```bash
cat web/lib/ai/usage-tracking.sql
# Copy the output and paste into Supabase → SQL Editor → New Query
```

### 5. Create the API route

Create `/web/app/api/ai/extract-problem/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractProblemFromImage } from '@/lib/ai/problem-extractor.example';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check daily usage limit
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('ai_extraction_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today);

    const DAILY_LIMIT = 5;
    if (count && count >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Daily extraction limit reached (${DAILY_LIMIT} per day)`,
          remaining: 0,
        },
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

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image.' },
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
      problem_type: extractedData.problem_type,
      extraction_success: true,
    });

    // 7. Return extracted data + remaining uses
    return NextResponse.json({
      ...extractedData,
      remaining_uses: DAILY_LIMIT - (count || 0) - 1,
    });
  } catch (error) {
    console.error('Problem extraction error:', error);

    // Log failed attempt
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('ai_extraction_usage').insert({
        user_id: user.id,
        extraction_success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return NextResponse.json(
      { error: 'Extraction failed. Please try again or enter manually.' },
      { status: 500 }
    );
  }
}
```

### 6. Add UI to the problem form

In `/web/app/(app)/subjects/[id]/problems/problem-form.tsx`, add a "Scan Problem" button that:
1. Opens a file picker or camera
2. Uploads the image to the new API endpoint
3. Pre-fills the form with the returned data
4. Shows warnings if extraction confidence is low
5. Allows the student to review and edit before submitting

## Frontend Integration Example

```typescript
async function handleImageUpload(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/ai/extract-problem', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const { error } = await response.json();
    alert(error);
    return;
  }

  const data = await response.json();

  // Pre-fill the form with extracted data
  setTitle(data.title);
  setContent(data.content);
  setProblemType(data.problem_type);

  if (data.answer_config) {
    setAnswerConfig(data.answer_config);
  }

  // Show warnings if any
  if (data.extraction_confidence?.warnings?.length) {
    setWarnings(data.extraction_confidence.warnings);
  }

  // Show remaining uses
  toast.success(
    `Problem extracted! ${data.remaining_uses} scans remaining today.`
  );
}
```

## Privacy Consideration

The Gemini free tier terms state that prompts and responses may be used to improve Google products. If student exam content privacy is a concern, you should:

1. Add a notice in your app's privacy policy
2. Switch to the paid tier (~$3/month for a school) which doesn't use data for training
3. Allow users to opt-in to the feature explicitly

## Next Steps

1. Implement the API route
2. Add the "Scan Problem" UI to the problem form
3. Test with various problem types (printed, handwritten, with/without math)
4. Monitor usage and extraction quality
5. Adjust the daily limit (5) as needed based on user feedback

## Testing

See `problem-extractor.example.ts` for example extraction results for different problem types.

Test with:
- Textbook screenshots (clean, printed text)
- Handwritten problems (lower accuracy expected)
- Photos of worksheets/exams
- Math-heavy problems (LaTeX extraction)
- Different MCQ formats (A/B/C/D vs 1/2/3/4)
