'use client';

import { Button } from '@/components/ui/button';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import { SolutionRevealProps } from '@/lib/types';
import type {
  MCQAnswerConfig,
  ShortAnswerTextConfig,
  ShortAnswerNumericConfig,
} from '@/lib/types';

function StructuredAnswerDisplay({
  answerConfig,
}: {
  answerConfig: NonNullable<SolutionRevealProps['answerConfig']>;
}) {
  if (answerConfig.type === 'mcq') {
    const config = answerConfig as MCQAnswerConfig;
    const correctChoice = config.choices.find(
      c => c.id === config.correct_choice_id
    );
    return (
      <div className="space-y-2">
        <p className="font-mono text-lg">
          {config.correct_choice_id}
          {correctChoice ? `: ${correctChoice.text}` : ''}
        </p>
        <div className="space-y-1">
          {config.choices.map(choice => (
            <div
              key={choice.id}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                choice.id === config.correct_choice_id
                  ? 'bg-green-100/60 font-medium text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'text-muted-foreground'
              }`}
            >
              <span className="font-semibold">{choice.id}.</span>
              <span>{choice.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (answerConfig.type === 'short') {
    if ((answerConfig as ShortAnswerTextConfig).mode === 'text') {
      const config = answerConfig as ShortAnswerTextConfig;
      return (
        <div className="space-y-1">
          <p className="text-sm text-green-700 dark:text-green-300 mb-1">
            Acceptable answers:
          </p>
          <div className="flex flex-wrap gap-2">
            {config.acceptable_answers.map((answer, i) => (
              <span
                key={i}
                className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-mono text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
              >
                {answer}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if ((answerConfig as ShortAnswerNumericConfig).mode === 'numeric') {
      const config = answerConfig as ShortAnswerNumericConfig;
      const { correct_value, tolerance, unit } = config.numeric_config;
      return (
        <p className="font-mono text-lg">
          {correct_value} &plusmn; {tolerance}
          {unit ? ` ${unit}` : ''}
        </p>
      );
    }
  }

  return null;
}

export default function SolutionReveal({
  solutionText,
  solutionAssets,
  correctAnswer,
  answerConfig,
  problemType,
  isRevealed,
  onToggle,
  wrapperClassName,
}: SolutionRevealProps) {
  const hasStructuredAnswer = !!answerConfig;
  const hasCorrectAnswer =
    hasStructuredAnswer ||
    (correctAnswer !== undefined && correctAnswer !== null);

  // Consider it a "solution" if there's solution text, assets, OR a correct answer
  const hasSolution =
    solutionText || solutionAssets.length > 0 || hasCorrectAnswer;

  return (
    <div
      className={
        wrapperClassName || 'bg-card rounded-lg border border-border p-4'
      }
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-green-900 dark:text-green-100">
          Solution
        </h2>
        {hasSolution && (
          <Button onClick={onToggle} variant="secondary">
            {isRevealed ? 'Hide Solution' : 'Reveal Solution'}
          </Button>
        )}
      </div>

      {!hasSolution ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <p className="text-sm">No solution provided for this problem</p>
        </div>
      ) : isRevealed ? (
        <div className="space-y-4">
          {/* Correct Answer */}
          {(hasStructuredAnswer ||
            (correctAnswer !== undefined && correctAnswer !== null)) && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-4">
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Correct Answer
              </h3>
              <div className="text-green-700 dark:text-green-300">
                {hasStructuredAnswer ? (
                  <StructuredAnswerDisplay answerConfig={answerConfig!} />
                ) : problemType === 'extended' ? (
                  <div className="prose max-w-none rich-text-content">
                    <RichTextDisplay content={String(correctAnswer)} />
                  </div>
                ) : (
                  <p className="font-mono text-lg">
                    {JSON.stringify(correctAnswer)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Solution Text */}
          {solutionText && (
            <div className="space-y-2">
              <div className="prose max-w-none rich-text-content">
                <RichTextDisplay content={solutionText} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">
            Click "Reveal Solution" to view the solution
          </p>
        </div>
      )}
    </div>
  );
}
