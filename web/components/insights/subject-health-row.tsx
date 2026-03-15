'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUBJECT_CONSTANTS } from '@/lib/constants';
import type { SubjectColor } from '@/lib/constants';

interface SubjectHealthRowProps {
  subjectId: string;
  subjectName: string;
  subjectColor?: string;
  assessment: string;
}

export function SubjectHealthRow({
  subjectId,
  subjectName,
  subjectColor,
  assessment,
}: SubjectHealthRowProps) {
  const color = (subjectColor || 'amber') as SubjectColor;
  const colorConfig =
    SUBJECT_CONSTANTS.COLOR_GRADIENTS[color] ||
    SUBJECT_CONSTANTS.COLOR_GRADIENTS.amber;

  return (
    <Link
      href={`/insights/${subjectId}`}
      className={cn(
        'group flex items-center gap-3 rounded-xl border p-3 transition-colors',
        'bg-white/50 hover:bg-white/80',
        'dark:bg-gray-800/30 dark:hover:bg-gray-800/50',
        'border-gray-200/40 dark:border-gray-700/30'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', colorConfig.iconColor)}>
          {subjectName}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {assessment}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500" />
    </Link>
  );
}
