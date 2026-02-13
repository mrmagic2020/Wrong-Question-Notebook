'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProblemStatus } from '@/lib/schemas';
import ProblemReview from '@/app/(app)/subjects/[id]/problems/[problemId]/review/problem-review';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Problem } from '@/lib/types';

interface SessionReviewClientProps {
  problemSetId: string;
  sessionId: string;
  subjectId: string;
  subjectName: string;
  isReadOnly: boolean;
}

interface SessionData {
  session: {
    id: string;
    session_state: {
      problem_ids: string[];
      current_index: number;
      completed_problem_ids: string[];
      skipped_problem_ids: string[];
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
}: SessionReviewClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  // Track whether the user has selected a status for the current problem
  const [statusSelectedForCurrent, setStatusSelectedForCurrent] =
    useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/review-sessions/${sessionId}`);
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

  // Reset status selection tracking when navigating to a new problem
  useEffect(() => {
    if (!sessionData) return;
    const problemIds = sessionData.session.session_state.problem_ids;
    const currentProblemId = problemIds[currentIndex];
    const { completed_problem_ids } = sessionData.session.session_state;

    // If the problem was already completed, consider it as "status selected"
    setStatusSelectedForCurrent(
      completed_problem_ids.includes(currentProblemId)
    );
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
        }),
      });

      // Update local state
      if (sessionData) {
        const newState = { ...sessionData.session.session_state };
        newState.current_index = nextIndex;

        if (wasSkipped) {
          if (!newState.skipped_problem_ids.includes(problemId)) {
            newState.skipped_problem_ids = [
              ...newState.skipped_problem_ids,
              problemId,
            ];
          }
        } else {
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

  const handleStatusSelected = async (_status: ProblemStatus) => {
    if (!sessionData) return;
    const problemIds = sessionData.session.session_state.problem_ids;
    const currentProblemId = problemIds[currentIndex];
    const { completed_problem_ids } = sessionData.session.session_state;

    // Only record progress if not already completed
    if (!completed_problem_ids.includes(currentProblemId)) {
      const wasCorrect = _status === 'mastered' ? true : false;
      await updateProgress(currentProblemId, false, wasCorrect, currentIndex);
    }

    setStatusSelectedForCurrent(true);
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
        <Button onClick={() => router.push(`/problem-sets/${problemSetId}`)}>
          Back to Problem Set
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

  // Check if we're at the foremost (furthest reached) problem
  // We're at the foremost if the next problem hasn't been completed yet
  const nextProblemId =
    currentIndex < problemIds.length - 1
      ? problemIds[currentIndex + 1]
      : null;
  const isForemost =
    !nextProblemId || !completed_problem_ids.includes(nextProblemId);

  return (
    <div className="section-container">
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
          nextEnabled: statusSelectedForCurrent,
          isLastProblem,
          onFinish: handleCompleteSession,
          isForemost,
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
  );
}
