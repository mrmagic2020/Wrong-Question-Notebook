import { z } from 'zod';

export const ProblemType = z.enum(['mcq', 'fill', 'short', 'extended']);
export type ProblemType = z.infer<typeof ProblemType>;

export const ProblemStatus = z.enum(['wrong', 'needs_review', 'mastered']);
export type ProblemStatus = z.infer<typeof ProblemStatus>;

const Asset = z.object({
  path: z.string(),
  kind: z.enum(['image', 'pdf']).optional(),
});

export const CreateProblemDto = z.object({
  subject_id: z.uuid(),
  content: z.string().min(1),
  problem_type: ProblemType,
  correct_answer: z.any().optional(),
  auto_mark: z.boolean().default(false),
  status: ProblemStatus.default('needs_review'),
  assets: z.array(Asset).default([]),

  // NEW:
  solution_text: z.string().optional(),
  solution_assets: z.array(Asset).default([]),

  tag_ids: z.array(z.uuid()).optional(),
});

export const UpdateProblemDto = CreateProblemDto.partial();

export const CreateTagDto = z.object({
  subject_id: z.uuid(),
  name: z.string().min(1).max(120),
});

export const UpdateTagDto = z.object({
  name: z.string().min(1).max(120).optional(),
});

export const CreateAttemptDto = z.object({
  problem_id: z.uuid(),
  submitted_answer: z.any(), // keep flexible; will handle in review endpoints later
  is_correct: z.boolean().nullable().optional(), // optional for manual types
  cause: z.string().optional(), // reflection text
});

export const ListAttemptsQuery = z.object({
  problem_id: z.uuid(),
});
