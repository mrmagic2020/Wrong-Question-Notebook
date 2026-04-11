'use client';

import { NotebookPen, PenLine, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface EmptyStateProps {
  onAddManually: () => void;
  onAddScan: () => void;
}

export default function EmptyState({
  onAddManually,
  onAddScan,
}: EmptyStateProps) {
  const t = useTranslations('Subjects');
  return (
    <div className="flex flex-col items-center justify-center bg-amber-50/20 dark:bg-gray-800/10 rounded-2xl border border-dashed border-amber-300/30 dark:border-gray-700/30 p-12">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center mb-5">
        <NotebookPen className="w-8 h-8 text-amber-500 dark:text-amber-400" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {t('emptyStateTitle')}
      </h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        {t('emptyStateDescription')}
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onAddManually}
          className="border-dashed text-muted-foreground hover:border-amber-400/50 dark:hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
        >
          <PenLine className="h-4 w-4 mr-2" />
          {t('writeManually')}
        </Button>
        <Button
          variant="outline"
          onClick={onAddScan}
          className="border-dashed text-muted-foreground hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
        >
          <ScanLine className="h-4 w-4 mr-2" />
          {t('scanFromImage')}
        </Button>
      </div>
    </div>
  );
}
