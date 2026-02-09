'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProblemType, ProblemStatus } from '@/lib/schemas';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import AnswerInput from './answer-input';
import SolutionReveal from './solution-reveal';
import StatusSelector from './status-selector';
import { Problem, Subject, MCQAnswerConfig } from '@/lib/types';

interface AllProblem {
  id: string;
  title: string;
  problem_type: ProblemType;
  status: ProblemStatus;
}

interface ProblemReviewProps {
  problem: Problem;
  subject: Subject;
  allProblems: AllProblem[];
  prevProblem?: AllProblem | null;
  nextProblem?: AllProblem | null;
  isProblemSetMode?: boolean;
  problemSetId?: string;
  isReadOnly?: boolean;
}

export default function ProblemReview({
  problem,
  subject,
  allProblems,
  prevProblem,
  nextProblem,
  isProblemSetMode = false,
  problemSetId,
  isReadOnly = false,
}: ProblemReviewProps) {
  const router = useRouter();
  const [userAnswer, setUserAnswer] = useState<any>('');
  const [submittedAnswer, setSubmittedAnswer] = useState<any>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ProblemStatus | null>(
    null
  );

  // Get current problem index for navigation
  const currentIndex = allProblems.findIndex(p => p.id === problem.id);
  const effectivePrevProblem = isProblemSetMode
    ? prevProblem
    : currentIndex > 0
      ? allProblems[currentIndex - 1]
      : null;
  const effectiveNextProblem = isProblemSetMode
    ? nextProblem
    : currentIndex < allProblems.length - 1
      ? allProblems[currentIndex + 1]
      : null;

  const handleAnswerSubmit = async () => {
    if (!problem.auto_mark) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/problems/${problem.id}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submitted_answer: userAnswer,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit answer');
      }

      setSubmittedAnswer(userAnswer);
      setIsCorrect(result.data.is_correct);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: ProblemStatus) => {
    if (!problem?.id) {
      setError('Invalid problem');
      return;
    }

    setSelectedStatus(newStatus);

    // Always update last_reviewed_date when user selects a status
    // Only update status if it's different from current
    const updateData: any = {
      last_reviewed_date: new Date().toISOString(),
    };

    if (newStatus !== problem.status) {
      updateData.status = newStatus;
    }

    try {
      const response = await fetch(`/api/problems/${problem.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update status';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Refresh the page to get updated data
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      // Reset selection on error
      setSelectedStatus(null);
    }
  };

  const navigateToProblem = (problemId: string) => {
    if (isProblemSetMode && problemSetId) {
      router.push(
        `/problem-sets/${problemSetId}/review?problemId=${problemId}`
      );
    } else {
      router.push(`/subjects/${subject.id}/problems/${problemId}/review`);
    }
  };

  return (
    <div className="section-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-2">
          <h1 className="page-title">{problem.title}</h1>
          <p className="page-description">
            {subject.name} • {problem.problem_type.toUpperCase()}
          </p>
        </div>
        <Link
          href={
            isProblemSetMode
              ? `/problem-sets/${problemSetId}`
              : `/subjects/${subject.id}/problems`
          }
          className="text-sm text-primary underline hover:text-primary/80 transition-colors"
        >
          ← {isProblemSetMode ? 'Back to Problem Set' : 'Back to Problems'}
        </Link>
      </div>

      {/* Tags */}
      {problem.tags && problem.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {problem.tags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Problem Content */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-medium mb-4 text-card-foreground">
          Problem
        </h2>
        {problem.content && (
          <div className="prose max-w-none mb-4 rich-text-content">
            <RichTextDisplay content={problem.content} />
          </div>
        )}
      </div>

      {/* Answer Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-medium mb-4 text-card-foreground">
          Your Answer
        </h2>

        {!problem.auto_mark && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This problem requires manual review. Enter your answer below and
              click "View Solution" to check your work.
            </p>
          </div>
        )}

        <AnswerInput
          problemType={problem.problem_type}
          correctAnswer={problem.correct_answer}
          answerConfig={problem.answer_config}
          value={userAnswer}
          onChange={setUserAnswer}
          onSubmit={problem.auto_mark ? handleAnswerSubmit : undefined}
          disabled={
            isSubmitting ||
            (problem.auto_mark &&
              submittedAnswer !== null &&
              isCorrect === true)
          }
        />

        <div className="mt-4 flex gap-3">
          {problem.auto_mark && (
            <Button
              onClick={handleAnswerSubmit}
              disabled={
                isSubmitting ||
                !userAnswer ||
                (submittedAnswer !== null && isCorrect === true)
              }
            >
              {isSubmitting
                ? 'Submitting...'
                : submittedAnswer !== null && isCorrect === false
                  ? 'Resubmit Answer'
                  : 'Submit Answer'}
            </Button>
          )}

          {!problem.auto_mark && userAnswer && problem.correct_answer && (
            <Button
              onClick={() => setShowSolution(true)}
              className="bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600"
            >
              View Solution
            </Button>
          )}
        </div>

        {/* Answer Feedback */}
        {submittedAnswer !== null && isCorrect !== null && (
          <div
            className={`mt-4 p-4 rounded-md ${
              isCorrect
                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-lg ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {isCorrect ? '✓' : '✗'}
              </span>
              <span
                className={`font-medium ${isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}
              >
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            {problem.answer_config?.type === 'mcq' ? (
              <>
                <p className="text-sm text-muted-foreground mt-1">
                  Your choice:{' '}
                  {(() => {
                    const config = problem.answer_config as MCQAnswerConfig;
                    const picked = config.choices.find(
                      c => c.id === submittedAnswer
                    );
                    return picked
                      ? `${picked.id}${picked.text ? `. ${picked.text}` : ''}`
                      : submittedAnswer;
                  })()}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Your answer: {JSON.stringify(submittedAnswer)}
              </p>
            )}
            {!isCorrect && problem.auto_mark && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                You can try again with a different answer.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Solution Section */}
      <SolutionReveal
        solutionText={problem.solution_text || undefined}
        solutionAssets={problem.solution_assets || []}
        correctAnswer={problem.correct_answer}
        answerConfig={problem.answer_config}
        problemType={problem.problem_type}
        isRevealed={showSolution}
        onToggle={() => setShowSolution(!showSolution)}
      />

      {/* Status Update (hidden for read-only viewers) */}
      {!isReadOnly && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-medium mb-4 text-card-foreground">
            Problem Status
          </h2>
          <StatusSelector
            currentStatus={problem.status}
            selectedStatus={selectedStatus}
            onStatusChange={handleStatusUpdate}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center bg-card rounded-lg border border-border p-4">
        <Button
          onClick={() =>
            effectivePrevProblem && navigateToProblem(effectivePrevProblem.id)
          }
          disabled={!effectivePrevProblem}
          variant="secondary"
        >
          ← Previous
        </Button>

        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} of {allProblems.length}
        </span>

        <Button
          onClick={() =>
            effectiveNextProblem && navigateToProblem(effectiveNextProblem.id)
          }
          disabled={!effectiveNextProblem}
          variant="secondary"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
