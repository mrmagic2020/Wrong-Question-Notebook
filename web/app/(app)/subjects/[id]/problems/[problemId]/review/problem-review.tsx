'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProblemType, ProblemStatus } from '@/lib/schemas';
import AnswerInput from './answer-input';
import AssetPreview from './asset-preview';
import SolutionReveal from './solution-reveal';
import StatusSelector from './status-selector';

interface Problem {
  id: string;
  title: string;
  content?: string;
  problem_type: ProblemType;
  correct_answer?: any;
  auto_mark: boolean;
  status: ProblemStatus;
  assets: Array<{ path: string; kind?: 'image' | 'pdf' }>;
  solution_text?: string;
  solution_assets: Array<{ path: string; kind?: 'image' | 'pdf' }>;
  tags: Array<{ id: string; name: string }>;
}

interface Subject {
  id: string;
  name: string;
}

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
}

export default function ProblemReview({
  problem,
  subject,
  allProblems,
}: ProblemReviewProps) {
  const router = useRouter();
  const [userAnswer, setUserAnswer] = useState<any>('');
  const [submittedAnswer, setSubmittedAnswer] = useState<any>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current problem index for navigation
  const currentIndex = allProblems.findIndex(p => p.id === problem.id);
  const prevProblem = currentIndex > 0 ? allProblems[currentIndex - 1] : null;
  const nextProblem =
    currentIndex < allProblems.length - 1
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
      setIsCorrect(result.is_correct);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: ProblemStatus) => {
    try {
      const response = await fetch(`/api/problems/${problem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh the page to get updated data
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const navigateToProblem = (problemId: string) => {
    router.push(`/subjects/${subject.id}/problems/${problemId}/review`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{problem.title}</h1>
          <p className="text-muted-foreground">
            {subject.name} • {problem.problem_type.toUpperCase()}
          </p>
        </div>
        <Link
          href={`/subjects/${subject.id}/problems`}
          className="text-sm text-primary underline hover:text-primary/80 transition-colors"
        >
          ← Back to Problems
        </Link>
      </div>

      {/* Tags */}
      {problem.tags.length > 0 && (
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
        <h2 className="text-lg font-medium mb-4 text-card-foreground">Problem</h2>
        {problem.content && (
          <div className="prose max-w-none mb-4">
            <div dangerouslySetInnerHTML={{ __html: problem.content }} />
          </div>
        )}

        {/* Problem Assets */}
        {problem.assets.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Assets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {problem.assets.map((asset, index) => (
                <AssetPreview key={index} asset={asset} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Answer Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-medium mb-4 text-card-foreground">Your Answer</h2>

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
          value={userAnswer}
          onChange={setUserAnswer}
          disabled={
            isSubmitting || (problem.auto_mark && submittedAnswer !== null)
          }
        />

        <div className="mt-4 flex gap-3">
          {problem.auto_mark && (
            <button
              onClick={handleAnswerSubmit}
              disabled={isSubmitting || !userAnswer || submittedAnswer !== null}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          )}

          {!problem.auto_mark && userAnswer && (
            <button
              onClick={() => setShowSolution(true)}
              className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              View Solution
            </button>
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
            <p className="text-sm text-muted-foreground mt-1">
              Your answer: {JSON.stringify(submittedAnswer)}
            </p>
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
        solutionText={problem.solution_text}
        solutionAssets={problem.solution_assets}
        isRevealed={showSolution}
        onToggle={() => setShowSolution(!showSolution)}
      />

      {/* Status Update */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-medium mb-4 text-card-foreground">Problem Status</h2>
        <StatusSelector
          currentStatus={problem.status}
          onStatusChange={handleStatusUpdate}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center bg-card rounded-lg border border-border p-4">
        <button
          onClick={() => prevProblem && navigateToProblem(prevProblem.id)}
          disabled={!prevProblem}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80 transition-colors"
        >
          ← Previous
        </button>

        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} of {allProblems.length}
        </span>

        <button
          onClick={() => nextProblem && navigateToProblem(nextProblem.id)}
          disabled={!nextProblem}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
