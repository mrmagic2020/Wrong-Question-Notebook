import { z } from 'zod';

export const ProblemType = z.enum(['mcq', 'fill', 'short', 'extended']);
export type ProblemType = z.infer<typeof ProblemType>;

export const ProblemStatus = z.enum(['wrong', 'needs_review', 'mastered']);
export type ProblemStatus = z.infer<typeof ProblemStatus>;

// Create/Update DTOs
export const CreateSubjectDto = z.object({
  name: z.string().min(1).max(120),
});

export const CreateProblemDto = z.object({
  subject_id: z.string().uuid(),
  content: z.string().min(1),
  assets: z
    .array(
      z.object({
        path: z.string(),
        kind: z.enum(['image', 'pdf']).optional(),
      })
    )
    .default([]),
  problem_type: ProblemType,
  correct_answer: z.any().optional(), // keep flexible for now
  auto_mark: z.boolean().default(false),
  status: ProblemStatus.default('needs_review'),
});

export const UpdateProblemDto = CreateProblemDto.partial();
export const UpdateSubjectDto = CreateSubjectDto.partial();
