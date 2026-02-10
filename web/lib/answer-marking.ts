import type { ProblemType } from './schemas';
import type {
  AnswerConfig,
  MCQAnswerConfig,
  ShortAnswerTextConfig,
  ShortAnswerNumericConfig,
} from './types';

/**
 * Determines if a submitted answer is correct based on the problem's
 * answer configuration (enhanced) or legacy correct_answer (fallback).
 */
export function markAnswer(
  problemType: ProblemType,
  submittedAnswer: string | number,
  answerConfig: AnswerConfig | null | undefined,
  legacyCorrectAnswer: string | null
): boolean {
  // Enhanced path: use answer_config when available
  if (answerConfig) {
    return markWithConfig(problemType, submittedAnswer, answerConfig);
  }

  // Legacy fallback: case-insensitive string comparison
  return markLegacy(problemType, submittedAnswer, legacyCorrectAnswer);
}

function markWithConfig(
  problemType: ProblemType,
  submittedAnswer: string | number,
  config: AnswerConfig
): boolean {
  // Extended problems should never be auto-marked
  if (problemType === 'extended') {
    return false;
  }

  // Validate that config type matches problem type
  // If mismatched, fall back to legacy marking by returning false
  if (problemType === 'mcq' && config.type !== 'mcq') {
    return false;
  }
  if (problemType === 'short' && config.type !== 'short') {
    return false;
  }

  if (config.type === 'mcq') {
    return markMCQ(submittedAnswer, config);
  }

  if (config.type === 'short') {
    if (config.mode === 'text') {
      return markShortText(submittedAnswer, config);
    }
    if (config.mode === 'numeric') {
      return markShortNumeric(submittedAnswer, config);
    }
  }

  return false;
}

function markMCQ(
  submittedAnswer: string | number,
  config: MCQAnswerConfig
): boolean {
  const submitted = String(submittedAnswer).trim();
  return submitted === config.correct_choice_id;
}

function markShortText(
  submittedAnswer: string | number,
  config: ShortAnswerTextConfig
): boolean {
  const submitted = String(submittedAnswer).trim().toLowerCase();
  return config.acceptable_answers.some(
    answer => answer.trim().toLowerCase() === submitted
  );
}

function markShortNumeric(
  submittedAnswer: string | number,
  config: ShortAnswerNumericConfig
): boolean {
  const submitted =
    typeof submittedAnswer === 'number'
      ? submittedAnswer
      : parseFloat(String(submittedAnswer).trim());

  if (isNaN(submitted)) return false;

  const { correct_value, tolerance } = config.numeric_config;
  return Math.abs(submitted - correct_value) <= tolerance;
}

function markLegacy(
  problemType: ProblemType,
  submittedAnswer: string | number,
  legacyCorrectAnswer: string | null
): boolean {
  if (problemType === 'extended' || !legacyCorrectAnswer) return false;

  const userAnswer = String(submittedAnswer).trim().toLowerCase();
  const correctAnswer = legacyCorrectAnswer.trim().toLowerCase();
  return userAnswer === correctAnswer;
}
