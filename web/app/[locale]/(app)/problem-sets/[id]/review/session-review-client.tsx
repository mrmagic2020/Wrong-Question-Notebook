'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BackLink } from '@/components/back-link';
import { Clock, Eye, LogOut, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { ProblemStatus } from '@/lib/schemas';
import ProblemReview, {
  AttemptState,
} from '@/app/(app)/subjects/[id]/problems/[problemId]/review/problem-review';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Problem } from '@/lib/types';
import { formatDuration } from '@/lib/common-utils';

interface SessionReviewClientProps {
  problemSetId: string;
  sessionId: string;
  subjectId: string;
  subjectName: string;
  isReadOnly: boolean;
  allowCopying?: boolean;
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

export default function SessionReviewClient({
  problemSetId,
  sessionId,
  subjectId,
  subjectName,
  isReadOnly,
  allowCopying,
}: SessionReviewClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  // Track whether the user has saved the form for the current problem
  const [formSavedForCurrent, setFormSavedForCurrent] = useState(false);
  // Cache attempt state per problem so navigating back restores it
  const [attemptCache, setAttemptCache] = useState<
    Record<string, AttemptState>
  >({});

  // Timer state
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedMsRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerInitializedRef = useRef(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/review-sessions/${sessionId}`);
      if (res.status === 410) {
        toast.error(
          'All problems in this session were deleted. The session has been closed.'
        );
        router.push(`/problem-sets/${problemSetId}`);
        return;
      }
      if (!res.ok) throw new Error('Failed to load session');
      const data = await res.json();
      setSessionData(data.data);
      setCurrentIndex(data.data.session.session_state.current_index || 0);
    } catch {
      toast.error('Failed to load review session');
      router.push(`/problem-sets/${problemSetId}`);
    } finally {
      setLoading(false);
    }
  }, [sessionId, problemSetId, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Initialize timer from session state once loaded
  useEffect(() => {
    if (sessionData && !timerInitializedRef.current) {
      timerInitializedRef.current = true;
      const saved = sessionData.session.session_state.elapsed_ms;
      if (typeof saved === 'number' && saved > 0) {
        setElapsedMs(saved);
        elapsedMsRef.current = saved;
      }
    }
  }, [sessionData]);

  // Timer interval: tick every second when not paused
  useEffect(() => {
    if (!loading && sessionData && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedMs(prev => {
          const next = prev + 1000;
          elapsedMsRef.current = next;
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loading, sessionData, isPaused]);

  // Auto-pause when page becomes hidden (tab switch, minimize)
  useEffect(() => {
    if (isReadOnly) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      }
    };
    // Catch the case where the tab is already hidden on mount
    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isReadOnly]);

  // Reset form saved tracking when navigating to a new problem
  useEffect(() => {
    if (!sessionData) return;

    // Read-only users always have next enabled (no form to save)
    if (isReadOnly) {
      setFormSavedForCurrent(true);
      return;
    }

    const problemIds = sessionData.session.session_state.problem_ids;
    const currentProblemId = problemIds[currentIndex];
    const { completed_problem_ids } = sessionData.session.session_state;

    // If the problem was already completed, consider it as "form saved"
    setFormSavedForCurrent(completed_problem_ids.includes(currentProblemId));
  }, [currentIndex, sessionData, isReadOnly]);

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
          elapsed_ms: elapsedMsRef.current,
        }),
      });

      // Update local state — mirror server logic:
      // only track completion when wasCorrect is a boolean (actual answer)
      setSessionData(prev => {
        if (!prev) return prev;
        const newState = { ...prev.session.session_state };
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

        return {
          ...prev,
          session: {
            ...prev.session,
            session_state: newState,
          },
        };
      });
    } catch {
      console.error('Failed to update progress');
    }
  };

  const handleFormSaved = async (_status: ProblemStatus) => {
    if (!sessionData) return;
    const problemIds = sessionData.session.session_state.problem_ids;
    const currentProblemId = problemIds[currentIndex];
    const { completed_problem_ids } = sessionData.session.session_state;

    // Only record progress if not already completed
    if (!completed_problem_ids.includes(currentProblemId)) {
      const wasCorrect = _status === 'mastered';
      await updateProgress(currentProblemId, false, wasCorrect, currentIndex);
    }

    setFormSavedForCurrent(true);
  };

  const handleSkip = async () => {
    if (!sessionData) return;
    const problemIds = sessionData.session.session_state.problem_ids;
    const currentProblemId = problemIds[currentIndex];
    const nextIdx = Math.min(currentIndex + 1, problemIds.length - 1);

    if (!isReadOnly) {
      await updateProgress(currentProblemId, true, null, nextIdx);
    }

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
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleCompleteSession = async () => {
    if (isReadOnly) {
      router.push(`/problem-sets/${problemSetId}`);
      return;
    }

    try {
      const res = await fetch(`/api/review-sessions/${sessionId}/complete`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to complete session');
      router.push(
        `/problem-sets/${problemSetId}/summary?sessionId=${sessionId}`
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
            elapsed_ms: elapsedMsRef.current,
          }),
        });
      } catch {
        // Best effort
      }
    }
    router.push(`/problem-sets/${problemSetId}`);
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
        <BackLink onClick={() => router.push(`/problem-sets/${problemSetId}`)}>
          Back to Problem Set
        </BackLink>
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

  // Check if we're at the foremost (furthest reached) problem
  // We're at the foremost if the next problem hasn't been completed yet
  const nextProblemId =
    currentIndex < problemIds.length - 1 ? problemIds[currentIndex + 1] : null;
  const isForemost =
    !nextProblemId || !completed_problem_ids.includes(nextProblemId);

  return (
    <>
      <div className="section-container">
        {/* Read-only indicator for shared sessions */}
        {isReadOnly && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200/50 dark:border-amber-800/40 bg-amber-50/80 dark:bg-amber-900/20 px-4 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-300">
            <Eye className="h-4 w-4 shrink-0" />
            <span>Practice Mode — Progress not tracked</span>
          </div>
        )}
        {/* Problem Review with integrated session nav in sidebar */}
        <ProblemReview
          key={currentProblem.id}
          problem={currentProblem}
          subject={{ id: subjectId, name: subjectName }}
          allProblems={sessionData.problems}
          prevProblem={prevProblem || null}
          nextProblem={nextProblem || null}
          isProblemSetMode={true}
          problemSetId={problemSetId}
          isReadOnly={isReadOnly}
          hideNavigation={true}
          onFormSaved={handleFormSaved}
          showExitButton={true}
          onExitSession={() => setExitDialogOpen(true)}
          initialAttemptState={attemptCache[currentProblem.id]}
          onAttemptRecorded={(problemId, state) =>
            setAttemptCache(prev => ({ ...prev, [problemId]: state }))
          }
          allowCopying={allowCopying}
          copyProblemSetId={problemSetId}
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
            nextEnabled: formSavedForCurrent,
            isLastProblem,
            onFinish: handleCompleteSession,
            isForemost,
            elapsedMs,
            onPause: () => setIsPaused(true),
          }}
        />

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

      {/* Pause Overlay - outside section-container to cover entire viewport */}
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
