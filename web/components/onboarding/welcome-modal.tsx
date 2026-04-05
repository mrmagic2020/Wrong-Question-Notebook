'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  NotebookPen,
  BookOpen,
  PenLine,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const t = useTranslations('Onboarding');
  const [step, setStep] = useState<1 | 2>(1);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md rounded-2xl border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-stone-900 dark:to-stone-950 p-0 gap-0 overflow-hidden"
      >
        {step === 1 ? (
          <div className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center auth-icon-entrance">
              <NotebookPen className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('welcomeTitle')}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('welcomeDesc')}
              </DialogDescription>
            </div>
            <DialogFooter className="flex-row justify-center gap-3 sm:justify-center">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-gray-500"
              >
                {t('skip')}
              </Button>
              <Button
                autoFocus
                onClick={() => setStep(2)}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6"
              >
                {t('next')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {t('howItWorks')}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                {t('threeSteps')}
              </DialogDescription>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t('createSubject')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('createSubjectDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <PenLine className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t('logProblems')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('logProblemsDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t('reviewMaster')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('reviewMasterDesc')}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row justify-center gap-3 sm:justify-center">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-gray-500"
              >
                {t('skip')}
              </Button>
              <Button
                autoFocus
                onClick={handleClose}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6"
              >
                {t('letsGo')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
