'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api-utils';

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

  // Ref to track current fetch abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  const startReview = async (problemSetId: string) => {
    // Cancel any existing in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setSessionLoading(problemSetId);
    try {
      const res = await fetch(
        apiUrl(`/api/problem-sets/${problemSetId}/start-session`),
        { method: 'POST', signal: abortController.signal }
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
      // Ignore abort errors and "Failed to fetch" which can happen on navigation
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return;
        }
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
          return;
        }
        toast.error(
          error instanceof Error ? error.message : 'Failed to start review'
        );
      }
    } finally {
      setSessionLoading(null);
      abortControllerRef.current = null;
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

    // Cancel any existing in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setResumeDialog({ open: false, session: null, problemSetId: null });
    setSessionLoading(psId);
    try {
      if (oldSessionId) {
        await fetch(apiUrl(`/api/review-sessions/${oldSessionId}`), {
          method: 'DELETE',
          signal: abortController.signal,
        });
      }
      const res = await fetch(
        apiUrl(`/api/problem-sets/${psId}/start-session`),
        {
          method: 'POST',
          signal: abortController.signal,
        }
      );
      if (!res.ok) {
        throw new Error('Failed to start new session');
      }
      const data = await res.json();
      router.push(
        `/problem-sets/${psId}/review?sessionId=${data.data.sessionId}`
      );
    } catch (error) {
      // Ignore abort errors and "Failed to fetch" which can happen on navigation
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return;
        }
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
          return;
        }
      }
      toast.error('Failed to start new session');
    } finally {
      setSessionLoading(null);
      abortControllerRef.current = null;
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
