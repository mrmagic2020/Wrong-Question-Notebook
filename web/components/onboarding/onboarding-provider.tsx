'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { OnboardingStatus } from '@/lib/types';
import { WelcomeModal } from './welcome-modal';
import { OnboardingChecklist } from './onboarding-checklist';

type OnboardingStep = 'create-subject' | 'log-problem' | 'review-problem';

interface OnboardingContextValue {
  refreshChecklistStatus: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  refreshChecklistStatus: () => {},
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

export function OnboardingProvider({
  showOnboarding,
  children,
}: {
  showOnboarding: boolean;
  children: React.ReactNode;
}) {
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  // Read localStorage after mount to avoid SSR/client hydration mismatch
  useEffect(() => {
    if (!showOnboarding) return;
    try {
      if (localStorage.getItem('wqn:welcome-modal-seen') !== '1') {
        setIsWelcomeModalOpen(true);
      }
    } catch {
      setIsWelcomeModalOpen(true);
    }
  }, [showOnboarding]);
  const [checklistStatus, setChecklistStatus] =
    useState<OnboardingStatus | null>(null);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/onboarding/status');
      if (!res.ok) return;
      const json = await res.json();
      if (json.data) {
        setChecklistStatus(json.data);
      }
    } catch {
      // silently fail
    }
  }, []);

  const refreshChecklistStatus = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchStatus();
    }, 300);
  }, [fetchStatus]);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Fetch initial status when onboarding is active
  useEffect(() => {
    if (showOnboarding) {
      fetchStatus();
    }
  }, [showOnboarding, fetchStatus]);

  // Auto-complete when all tasks are done
  useEffect(() => {
    if (!checklistStatus || dismissed || showCongrats || isWelcomeModalOpen)
      return;

    if (
      checklistStatus.hasSubject &&
      checklistStatus.hasProblem &&
      checklistStatus.hasReviewed
    ) {
      setShowCongrats(true);
      fetch('/api/onboarding/complete', { method: 'POST' }).catch(() => {});
      const timer = setTimeout(() => {
        setDismissed(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [checklistStatus, dismissed, showCongrats, isWelcomeModalOpen]);

  const completeOnboarding = useCallback(async () => {
    setDismissed(true);
    try {
      localStorage.removeItem('wqn:welcome-modal-seen');
    } catch {
      // storage unavailable
    }
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' });
    } catch {
      // silently fail
    }
  }, []);

  // Derive current step
  const currentStep: OnboardingStep | null = !checklistStatus
    ? null
    : !checklistStatus.hasSubject
      ? 'create-subject'
      : !checklistStatus.hasProblem
        ? 'log-problem'
        : !checklistStatus.hasReviewed
          ? 'review-problem'
          : null;

  if (!showOnboarding || dismissed) {
    return (
      <OnboardingContext.Provider value={{ refreshChecklistStatus }}>
        {children}
      </OnboardingContext.Provider>
    );
  }

  const showChecklist =
    !isWelcomeModalOpen && checklistStatus !== null && !dismissed;

  return (
    <OnboardingContext.Provider value={{ refreshChecklistStatus }}>
      <div data-onboarding-step={currentStep ?? undefined}>{children}</div>

      <WelcomeModal
        open={isWelcomeModalOpen}
        onClose={() => {
          setIsWelcomeModalOpen(false);
          try {
            localStorage.setItem('wqn:welcome-modal-seen', '1');
          } catch {
            // storage unavailable
          }
        }}
      />

      {showChecklist && (
        <OnboardingChecklist
          status={checklistStatus}
          isExpanded={isChecklistExpanded}
          onToggleExpanded={() => setIsChecklistExpanded(v => !v)}
          onDismiss={completeOnboarding}
          showCongrats={showCongrats}
        />
      )}
    </OnboardingContext.Provider>
  );
}
