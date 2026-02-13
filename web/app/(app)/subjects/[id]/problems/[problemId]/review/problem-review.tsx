'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProblemType, ProblemStatus } from '@/lib/schemas';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import AnswerInput from './answer-input';
import SolutionReveal from './solution-reveal';
import StatusSelector from './status-selector';
import ReviewSessionNav from '@/components/review/review-session-nav';
import { Problem, Subject, MCQAnswerConfig } from '@/lib/types';
import {
  BookOpen,
  PencilLine,
  Tag,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

interface AllProblem {
  id: string;
  title: string;
  problem_type: ProblemType;
  status: ProblemStatus;
}

interface SessionNavProps {
  currentIndex: number;
  totalProblems: number;
  completedCount: number;
  skippedCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  nextEnabled?: boolean;
  isLastProblem?: boolean;
  onFinish?: () => void;
  isForemost?: boolean;
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
  /** Hide the built-in bottom navigation (session mode uses its own nav) */
  hideNavigation?: boolean;
  /** Called when the user selects a problem status */
  onStatusSelected?: (status: ProblemStatus) => void;
  /** Optional exit session button (for review sessions) */
  showExitButton?: boolean;
  onExitSession?: () => void;
  /** Optional session navigation props (for review sessions) */
  sessionNav?: SessionNavProps;
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
  hideNavigation = false,
  onStatusSelected,
  showExitButton = false,
  onExitSession,
  sessionNav,
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
  const [tagsExpanded, setTagsExpanded] = useState(false);

  // Scroll to top when problem changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [problem.id]);

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

      // Notify parent about status selection (for session progress tracking)
      onStatusSelected?.(newStatus);

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
    <div className="space-y-4">
      {/* Sticky Header with gradient */}
      <div className="review-header-sticky">
        <div className="flex items-center justify-between">
          {/* Title + metadata */}
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {problem.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {subject.name} • {problem.problem_type.toUpperCase()}
            </p>
          </div>

          {/* Actions: inline tags + toggle button + exit/back link */}
          <div className="flex items-center gap-2">
            {/* Tags appear inline to the left of the button when expanded */}
            {problem.tags && problem.tags.length > 0 && (
              <div
                className={`flex flex-wrap gap-1.5 max-w-md transition-all duration-300 ease-in-out ${
                  tagsExpanded
                    ? 'opacity-100 translate-x-0 max-h-20'
                    : 'opacity-0 -translate-x-2 max-h-0 overflow-hidden'
                }`}
              >
                {problem.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-full border border-amber-200 dark:border-amber-800 bg-amber-100/60 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            {problem.tags && problem.tags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTagsExpanded(!tagsExpanded)}
              >
                <Tag className="h-4 w-4 mr-1" />
                {tagsExpanded ? 'Hide' : 'Show'} tags
              </Button>
            )}
            {showExitButton && onExitSession && (
              <Button variant="ghost" size="sm" onClick={onExitSession}>
                <LogOut className="h-4 w-4 mr-1" />
                Exit Session
              </Button>
            )}
            {!showExitButton && (
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
            )}
          </div>
        </div>
      </div>

      {/* Two-column grid (desktop) / Stack (mobile) */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Combined Problem + Answer Card (BLUE gradient) */}
          <div className="review-section-blue">
            {/* Problem Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="review-icon-small bg-blue-500/10 dark:bg-blue-500/20">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                  Problem
                </h2>
              </div>
              {problem.content && (
                <div className="prose max-w-none pl-10 rich-text-content">
                  <RichTextDisplay content={problem.content} />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-blue-200/30 dark:border-blue-800/20 my-4" />

            {/* Answer Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="review-icon-small bg-blue-500/10 dark:bg-blue-500/20">
                  <PencilLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                  Your Answer
                </h2>
              </div>

              {!problem.auto_mark && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    This problem requires manual review. Enter your answer below
                    and click "View Solution" to check your work.
                  </p>
                </div>
              )}

              <div className="pl-10">
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

                  {!problem.auto_mark &&
                    userAnswer &&
                    problem.correct_answer && (
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
                            const config =
                              problem.answer_config as MCQAnswerConfig;
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
                    <p className="text-red-800 dark:text-red-200 text-sm">
                      {error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Solution Card (GREEN gradient) */}
          <div className="rounded-2xl overflow-hidden border border-green-200/40 dark:border-green-800/30">
            <SolutionReveal
              solutionText={problem.solution_text || undefined}
              solutionAssets={problem.solution_assets || []}
              correctAnswer={problem.correct_answer}
              answerConfig={problem.answer_config}
              problemType={problem.problem_type}
              isRevealed={showSolution}
              onToggle={() => setShowSolution(!showSolution)}
              wrapperClassName="bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-950/40 dark:to-emerald-900/20 p-4"
            />
          </div>
        </div>

        {/* RIGHT COLUMN - Sticky Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Status Selector (AMBER gradient) */}
          {!isReadOnly && (
            <div className="review-section-amber">
              <StatusSelector
                currentStatus={problem.status}
                selectedStatus={selectedStatus}
                onStatusChange={handleStatusUpdate}
                compact={true}
              />
            </div>
          )}

          {/* Session Navigation or Regular Navigation */}
          {sessionNav ? (
            /* Session Navigation with ROSE gradient styling */
            <ReviewSessionNav
              {...sessionNav}
              wrapperClassName="space-y-3 bg-gradient-to-br from-rose-50 to-pink-100/50 dark:from-rose-950/40 dark:to-pink-900/20 rounded-2xl p-4 border border-rose-200/40 dark:border-rose-800/30"
            />
          ) : (
            /* Regular Navigation (ROSE gradient) */
            !hideNavigation && (
              <div className="review-section-rose">
                <div className="text-xs text-muted-foreground mb-2 text-center">
                  Problem {currentIndex + 1} of {allProblems.length}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!effectivePrevProblem}
                    onClick={() =>
                      effectivePrevProblem &&
                      navigateToProblem(effectivePrevProblem.id)
                    }
                    aria-label="Previous problem"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!effectiveNextProblem}
                    onClick={() =>
                      effectiveNextProblem &&
                      navigateToProblem(effectiveNextProblem.id)
                    }
                    aria-label="Next problem"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
