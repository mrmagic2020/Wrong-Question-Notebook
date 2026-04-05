'use client';

import { PenLine, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';

interface ProblemFabProps {
  hidden: boolean;
  onAddManually: () => void;
  onAddScan: () => void;
}

export default function ProblemFab({
  hidden,
  onAddManually,
  onAddScan,
}: ProblemFabProps) {
  if (hidden) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 fab-enter"
      data-onboarding-target="log-problem"
    >
      <div className="flex items-center gap-0 rounded-2xl shadow-xl shadow-amber-500/15 dark:shadow-black/30 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/80 dark:to-orange-950/60 border border-amber-300/50 dark:border-amber-700/40 overflow-hidden ring-1 ring-amber-200/30 dark:ring-amber-800/20">
        <Button
          type="button"
          variant="ghost"
          onClick={onAddManually}
          className="rounded-none border-r border-amber-300/40 dark:border-amber-700/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors px-5 py-5 font-medium"
        >
          <PenLine className="h-4 w-4 mr-2" />
          Write
          <Kbd className="hidden md:inline-flex ml-2 translate-x-0.5 bg-amber-200/50 text-amber-700 dark:bg-amber-800/40 dark:text-amber-300">
            ⏎
          </Kbd>
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onAddScan}
          className="rounded-none text-blue-700 dark:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors px-5 py-5 font-medium"
        >
          <ScanLine className="h-4 w-4 mr-2" />
          Scan
          <Kbd className="hidden md:inline-flex ml-2 translate-x-0.5 bg-blue-200/50 text-blue-700 dark:bg-blue-800/40 dark:text-blue-300">
            ⇧⏎
          </Kbd>
        </Button>
      </div>
    </div>
  );
}
