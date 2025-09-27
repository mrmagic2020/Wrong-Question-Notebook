import { z } from 'zod';

// Import from schemas to maintain consistency
import { ProblemType, ProblemStatus } from './schemas';
export { ProblemType, ProblemStatus };
export type ProblemTypeType = z.infer<typeof ProblemType>;
export type ProblemStatusType = z.infer<typeof ProblemStatus>;

// Create/Update DTOs
export const CreateSubjectDto = z.object({
  name: z.string().min(1).max(120),
});

export const CreateProblemDto = z.object({
  subject_id: z.string().uuid(),
  content: z.string().optional(),
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
