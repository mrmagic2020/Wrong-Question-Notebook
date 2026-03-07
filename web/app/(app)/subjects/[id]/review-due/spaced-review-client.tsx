'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { ProblemStatus } from '@/lib/schemas';
import ProblemReview from '@/app/(app)/subjects/[id]/problems/[problemId]/review/problem-review';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import SRCorrectnessPrompt from '@/components/review/sr-correctness-prompt';
import { Problem } from '@/lib/types';
import { formatDuration } from '@/lib/common-utils';

interface SpacedReviewClientProps {
  subjectId: string;
  subjectName: string;
  sessionId: string;
}

interface SessionData {
  session: {
    id: string;
    session_state: {
      problem_ids: string[];
      current_index: number;
      completed_problem_ids: string[];
      skipped_problem_ids: string[];
      initial_statuses: Record<string, string>;
      elapsed_ms: number;
    };
  };
  problems: Problem[];
  results: any[];
}

export default function SpacedReviewClient({
  subjectId,
  subjectName,
  sessionId,
}: SpacedReviewClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  // Track whether the current problem has been assessed (auto-mark or SR prompt)
  const [assessedForCurrent, setAssessedForCurrent] = useState(false);

  // Timer state
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerInitializedRef = useRef(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/review-sessions/${sessionId}`);
      if (!res.ok) throw new Error('Failed to load session');
      const data = await res.json();
      setSessionData(data.data);
      setCurrentIndex(data.data.session.session_state.current_index || 0);
    } catch {
      toast.error('Failed to load review session');
      router.push(`/subjects/${subjectId}/problems`);
    } finally {
      setLoading(false);
    }
  }, [sessionId, subjectId, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Initialize timer from session state
  useEffect(() => {
    if (sessionData && !timerInitializedRef.current) {
      timerInitializedRef.current = true;
      const saved = sessionData.session.session_state.elapsed_ms;
      if (typeof saved === 'number' && saved > 0) {
        setElapsedMs(saved);
      }
    }
  }, [sessionData]);

  // Timer interval
  useEffect(() => {
    if (!loading && sessionData && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedMs(prev => prev + 1000);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loading, sessionData, isPaused]);

  // Reset assessment tracking when navigating to a new problem
  useEffect(() => {
    if (!sessionData) return;
    const problemIds = sessionData.session.session_state.problem_ids;
    const currentProblemId = problemIds[currentIndex];
    const { completed_problem_ids } = sessionData.session.session_state;
    setAssessedForCurrent(completed_problem_ids.includes(currentProblemId));
  }, [currentIndex, sessionData]);

  const updateProgress = async (
    problemId: string,
    wasSkipped: boolean,
    wasCorrect: boolean | null,
    nextIndex: number
  ) => {
    try {
      await fetch(`/api/review-sessions/${sessionId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          wasSkipped,
          wasCorrect,
          currentIndex: nextIndex,
          elapsed_ms: elapsedMs,
        }),
      });

      if (sessionData) {
        const newState = { ...sessionData.session.session_state };
        newState.current_index = nextIndex;
        const isAnswer = !wasSkipped && typeof wasCorrect === 'boolean';

        if (wasSkipped) {
          if (!newState.skipped_problem_ids.includes(problemId)) {
            newState.skipped_problem_ids = [
              ...newState.skipped_problem_ids,
              problemId,
            ];
          }
        } else if (isAnswer) {
          if (!newState.completed_problem_ids.includes(problemId)) {
            newState.completed_problem_ids = [
              ...newState.completed_problem_ids,
              problemId,
            ];
          }
          newState.skipped_problem_ids = newState.skipped_problem_ids.filter(
            id => id !== problemId
          );
        }

        setSessionData({
          ...sessionData,
          session: {
            ...sessionData.session,
            session_state: newState,
          },
        });
      }
    } catch {
      console.error('Failed to update progress');
    }
  };

  // Called when SR correctness prompt is confirmed (non-auto-mark problems)
  const handleSRAssessed = async (isCorrect: boolean) => {
    if (!sessionData) return;
    const problemIds = sessionData.session.session_state.problem_ids;
    const currentProblemId = problemIds[currentIndex];
    const { completed_problem_ids } = sessionData.session.session_state;

    if (!completed_problem_ids.includes(currentProblemId)) {
      await updateProgress(currentProblemId, false, isCorrect, currentIndex);
    }
    setAssessedForCurrent(true);
  };

  // Called when the user selects a status (for auto-mark problems, status triggers completion)
  const handleStatusSelected = async (_status: ProblemStatus) => {
    if (!sessionData) return;
    const problemIds = sessionData.session.session_state.problem_ids;
    const currentProblemId = problemIds[currentIndex];
    const { completed_problem_ids } = sessionData.session.session_state;

    if (!completed_problem_ids.includes(currentProblemId)) {
      const wasCorrect = _status === 'mastered';
      await updateProgress(currentProblemId, false, wasCorrect, currentIndex);
    }
    setAssessedForCurrent(true);
  };

  const handleSkip = async () => {
    if (!sessionData) return;
    const problemIds = sessionData.session.session_state.problem_ids;
    const currentProblemId = problemIds[currentIndex];
    const nextIdx = Math.min(currentIndex + 1, problemIds.length - 1);

    await updateProgress(currentProblemId, true, null, nextIdx);

    if (currentIndex >= problemIds.length - 1) {
      handleCompleteSession();
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  const handleNext = () => {
    if (!sessionData) return;
    const problemIds = sessionData.session.session_state.problem_ids;

    if (currentIndex >= problemIds.length - 1) {
      handleCompleteSession();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleCompleteSession = async () => {
    try {
      const res = await fetch(`/api/review-sessions/${sessionId}/complete`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to complete session');
      router.push(
        `/subjects/${subjectId}/review-due/summary?sessionId=${sessionId}`
      );
    } catch {
      toast.error('Failed to complete session');
    }
  };

  const handleExitSession = async () => {
    setExitDialogOpen(false);
    if (sessionData) {
      try {
        await fetch(`/api/review-sessions/${sessionId}/progress`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemId:
              sessionData.session.session_state.problem_ids[currentIndex],
            wasSkipped: false,
            wasCorrect: null,
            currentIndex,
            elapsed_ms: elapsedMs,
          }),
        });
      } catch {
        // Best effort
      }
    }
    router.push(`/subjects/${subjectId}/problems`);
  };

  if (loading || !sessionData) {
    return (
      <div className="section-container flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading review session...</p>
        </div>
      </div>
    );
  }

  const problemIds = sessionData.session.session_state.problem_ids;
  const currentProblemId = problemIds[currentIndex];
  const currentProblem = sessionData.problems.find(
    p => p.id === currentProblemId
  );

  if (!currentProblem) {
    return (
      <div className="section-container text-center py-12">
        <h2 className="text-xl font-bold mb-2">Problem not found</h2>
        <p className="text-muted-foreground mb-4">
          The current problem could not be loaded.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push(`/subjects/${subjectId}/problems`)}
        >
          Back to Problems
        </Button>
      </div>
    );
  }

  const prevProblem =
    currentIndex > 0
      ? sessionData.problems.find(p => p.id === problemIds[currentIndex - 1])
      : null;
  const nextProblem =
    currentIndex < problemIds.length - 1
      ? sessionData.problems.find(p => p.id === problemIds[currentIndex + 1])
      : null;

  const { completed_problem_ids, skipped_problem_ids } =
    sessionData.session.session_state;

  const isLastProblem = currentIndex >= problemIds.length - 1;
  const isAutoMark = currentProblem.auto_mark;

  // Check if at the foremost problem
  const nextProblemId =
    currentIndex < problemIds.length - 1 ? problemIds[currentIndex + 1] : null;
  const isForemost =
    !nextProblemId || !completed_problem_ids.includes(nextProblemId);

  return (
    <>
      <div className="section-container">
        {/* Problem Review with integrated session nav */}
        <ProblemReview
          key={currentProblem.id}
          problem={currentProblem}
          subject={{ id: subjectId, name: subjectName }}
          allProblems={sessionData.problems}
          prevProblem={prevProblem || null}
          nextProblem={nextProblem || null}
          hideNavigation={true}
          onStatusSelected={handleStatusSelected}
          showExitButton={true}
          onExitSession={() => setExitDialogOpen(true)}
          sessionNav={{
            currentIndex,
            totalProblems: problemIds.length,
            completedCount: completed_problem_ids.length,
            skippedCount: skipped_problem_ids.length,
            onPrevious: handlePrevious,
            onNext: handleNext,
            onSkip: handleSkip,
            hasPrevious: currentIndex > 0,
            hasNext: currentIndex < problemIds.length - 1,
            nextEnabled: assessedForCurrent,
            isLastProblem,
            onFinish: handleCompleteSession,
            isForemost,
            elapsedMs,
            onPause: () => setIsPaused(true),
          }}
        />

        {/* SR Correctness Prompt for non-auto-mark problems */}
        {!isAutoMark && !assessedForCurrent && (
          <div className="mt-4 max-w-2xl">
            <SRCorrectnessPrompt
              problemId={currentProblem.id}
              onCompleted={isCorrect => handleSRAssessed(isCorrect)}
            />
          </div>
        )}

        {/* Exit Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={exitDialogOpen}
          onCancel={() => setExitDialogOpen(false)}
          onConfirm={handleExitSession}
          title="Exit Review Session"
          message="Your progress will be saved. You can resume this session later."
          confirmText="Exit"
          cancelText="Continue Reviewing"
        />
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-background/60">
          <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-card border border-border shadow-lg max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-foreground">
              Session Paused
            </h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span className="font-mono tabular-nums text-lg">
                {formatDuration(elapsedMs)}
              </span>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={() => setIsPaused(false)}
                className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Continue Reviewing
              </Button>
              <Button
                variant="outline"
                onClick={handleExitSession}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
