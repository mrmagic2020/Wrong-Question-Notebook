'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ResumeDialogState {
  open: boolean;
  session: any;
  problemSetId: string | null;
}

export function useReviewSession() {
  const router = useRouter();
  const [sessionLoading, setSessionLoading] = useState<string | null>(null);
  const [resumeDialog, setResumeDialog] = useState<ResumeDialogState>({
    open: false,
    session: null,
    problemSetId: null,
  });

  const startReview = async (problemSetId: string) => {
    setSessionLoading(problemSetId);
    try {
      const res = await fetch(
        `/api/problem-sets/${problemSetId}/start-session`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to start session');
      }
      const data = await res.json();
      const result = data.data;

      if (result.hasActiveSession) {
        setResumeDialog({
          open: true,
          session: result.session,
          problemSetId,
        });
      } else {
        router.push(
          `/problem-sets/${problemSetId}/review?sessionId=${result.sessionId}`
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to start review'
      );
    } finally {
      setSessionLoading(null);
    }
  };

  const resumeSession = (sessionId: string) => {
    const psId = resumeDialog.problemSetId;
    setResumeDialog({ open: false, session: null, problemSetId: null });
    router.push(`/problem-sets/${psId}/review?sessionId=${sessionId}`);
  };

  const startNewSession = async () => {
    const psId = resumeDialog.problemSetId;
    const oldSessionId = resumeDialog.session?.id;
    setResumeDialog({ open: false, session: null, problemSetId: null });
    setSessionLoading(psId);
    try {
      if (oldSessionId) {
        await fetch(`/api/review-sessions/${oldSessionId}`, {
          method: 'DELETE',
        });
      }
      const res = await fetch(`/api/problem-sets/${psId}/start-session`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to start new session');
      }
      const data = await res.json();
      router.push(
        `/problem-sets/${psId}/review?sessionId=${data.data.sessionId}`
      );
    } catch {
      toast.error('Failed to start new session');
    } finally {
      setSessionLoading(null);
    }
  };

  const setResumeDialogOpen = (open: boolean) => {
    setResumeDialog(prev => ({ ...prev, open }));
  };

  return {
    sessionLoading,
    resumeDialog,
    startReview,
    resumeSession,
    startNewSession,
    setResumeDialogOpen,
  };
}
