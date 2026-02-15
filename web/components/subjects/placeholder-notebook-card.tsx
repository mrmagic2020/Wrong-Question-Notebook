'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceholderNotebookCardProps {
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function PlaceholderNotebookCard({
  onClick,
  className,
  style,
}: PlaceholderNotebookCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200',
        'rounded-2xl border-2 border-dashed',
        'bg-gradient-to-br from-gray-50 to-gray-100/50',
        'dark:from-gray-900/40 dark:to-gray-800/20',
        'border-gray-300/60 dark:border-gray-700/50',
        'hover:border-amber-300 dark:hover:border-amber-700',
        'hover:from-amber-50/50 hover:to-amber-100/30',
        'dark:hover:from-amber-950/20 dark:hover:to-amber-900/10',
        className
      )}
      style={style}
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              'bg-gray-200/50 dark:bg-gray-700/30',
              'group-hover:bg-amber-500/10 dark:group-hover:bg-amber-500/20'
            )}
          >
            <Plus className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        <h3 className="text-xl font-semibold mt-3 text-gray-500 dark:text-gray-400">
          New Subject
        </h3>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <p className="text-gray-400 dark:text-gray-500 text-xs">
          Click to create a new notebook for organizing your problems by
          subject.
        </p>
      </CardContent>
    </Card>
  );
}
