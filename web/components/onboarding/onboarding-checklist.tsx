'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { OnboardingStatus } from '@/lib/types';
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Minus,
  PartyPopper,
  X,
} from 'lucide-react';

interface OnboardingChecklistProps {
  status: OnboardingStatus;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onDismiss: () => void;
  showCongrats: boolean;
}

interface StepDef {
  key: 'hasSubject' | 'hasProblem' | 'hasReviewed';
  label: string;
}

const STEP_KEYS: Array<{
  key: 'hasSubject' | 'hasProblem' | 'hasReviewed';
  translationKey: string;
}> = [
  { key: 'hasSubject', translationKey: 'step1' },
  { key: 'hasProblem', translationKey: 'step2' },
  { key: 'hasReviewed', translationKey: 'step3' },
];

/**
 * Wrapper that animates height between 0 and auto using
 * `display: grid` + `grid-template-rows` trick.
 */
function AnimateHeight({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid transition-[grid-template-rows,opacity] duration-500 ease-in-out"
      style={{
        gridTemplateRows: show ? '1fr' : '0fr',
        opacity: show ? 1 : 0,
      }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

export function OnboardingChecklist({
  status,
  isExpanded,
  onToggleExpanded,
  onDismiss,
  showCongrats,
}: OnboardingChecklistProps) {
  const t = useTranslations('Onboarding');
  const router = useRouter();
  const completedCount = STEP_KEYS.filter(s => status[s.key]).length;
  const pct = Math.round((completedCount / STEP_KEYS.length) * 100);

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50 onboarding-checklist-enter">
        <button
          onClick={onToggleExpanded}
          className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 dark:bg-amber-900/30 px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40 shadow-md hover:bg-amber-200/70 dark:hover:bg-amber-800/40 transition-colors"
        >
          {t('gettingStarted')}
          <span className="inline-flex items-center justify-center rounded-full bg-amber-600 text-white text-xs font-bold w-5 h-5">
            {STEP_KEYS.length - completedCount}
          </span>
        </button>
      </div>
    );
  }

  const getNavTarget = (
    stepKey: StepDef['key']
  ): { href: string; disabled: boolean } => {
    switch (stepKey) {
      case 'hasSubject':
        return { href: '/subjects', disabled: false };
      case 'hasProblem':
        return status.firstSubjectId
          ? {
              href: `/subjects/${status.firstSubjectId}/problems`,
              disabled: false,
            }
          : { href: '', disabled: true };
      case 'hasReviewed':
        return status.firstProblemId && status.firstProblemSubjectId
          ? {
              href: `/subjects/${status.firstProblemSubjectId}/problems/${status.firstProblemId}/review`,
              disabled: false,
            }
          : { href: '', disabled: true };
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 onboarding-checklist-enter">
      <div className="rounded-2xl border border-amber-200/40 dark:border-amber-800/30 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-stone-900 dark:to-stone-900/80 shadow-lg w-80">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm transition-all duration-500">
            {showCongrats ? t('allDone') : t('gettingStarted')}
          </h3>
          {showCongrats ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onDismiss}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-amber-100/50 dark:hover:bg-amber-800/30 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={onToggleExpanded}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-amber-100/50 dark:hover:bg-amber-800/30 transition-colors"
                aria-label="Collapse"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-amber-200/50 dark:bg-amber-800/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 dark:bg-amber-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-medium tabular-nums">{pct}%</span>
          </div>
        </div>

        {/* Congrats — animates in */}
        <AnimateHeight show={showCongrats}>
          <div className="px-5 pb-5 pt-1 text-center space-y-2">
            <PartyPopper className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto" />
            <p className="font-semibold text-gray-900 dark:text-white">
              {t('allSet')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('completedSteps')}
            </p>
          </div>
        </AnimateHeight>

        {/* Steps — animates out */}
        <AnimateHeight show={!showCongrats}>
          <div className="px-5 pb-3 space-y-1">
            {STEP_KEYS.map(step => {
              const done = status[step.key];
              const nav = getNavTarget(step.key);
              return (
                <div
                  key={step.key}
                  className="flex items-center gap-3 py-1.5 group"
                >
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm flex-1 ${
                      done
                        ? 'text-gray-400 dark:text-gray-500 line-through'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t(step.translationKey)}
                  </span>
                  {!done && !nav.disabled && (
                    <button
                      onClick={() => router.push(nav.href)}
                      className="p-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-800/30 transition-colors"
                      aria-label={`Go to ${t(step.translationKey)}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dismiss link */}
          <div className="px-5 pb-1 pt-1 border-t border-amber-200/30 dark:border-amber-800/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="w-full text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-transparent transition-colors"
            >
              {t('dismissOnboarding')}
            </Button>
          </div>
        </AnimateHeight>
      </div>
    </div>
  );
}
