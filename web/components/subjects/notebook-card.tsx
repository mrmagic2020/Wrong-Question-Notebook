'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SubjectWithMetadata } from '@/lib/types';
import { SUBJECT_CONSTANTS } from '@/lib/constants';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, FileText, MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface NotebookCardProps {
  subject: SubjectWithMetadata;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function NotebookCard({
  subject,
  onClick,
  onEdit,
  onDelete,
}: NotebookCardProps) {
  const color = subject.color || SUBJECT_CONSTANTS.DEFAULT_COLOR;
  const iconName = subject.icon || SUBJECT_CONSTANTS.DEFAULT_ICON;
  const Icon = (Icons as any)[iconName] || Icons.BookOpen;
  const colorClasses =
    SUBJECT_CONSTANTS.COLOR_GRADIENTS[
      color as keyof typeof SUBJECT_CONSTANTS.COLOR_GRADIENTS
    ];

  const problemCount = subject.problem_count ?? 0;
  const lastActivity = subject.last_activity;
  const createdAt = subject.created_at;

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200',
        'rounded-2xl border bg-gradient-to-br',
        colorClasses.light,
        colorClasses.dark,
        colorClasses.border
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              colorClasses.icon
            )}
          >
            <Icon className={cn('w-6 h-6', colorClasses.iconColor)} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-8 w-8', colorClasses.buttonHover)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h3 className="text-xl font-semibold mt-3 truncate text-gray-900 dark:text-white">
          {subject.name}
        </h3>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <FileText className={cn('w-4 h-4', colorClasses.iconColor)} />
          <span className="text-gray-600 dark:text-gray-400">
            {problemCount} {problemCount === 1 ? 'problem' : 'problems'}
          </span>
        </div>

        {createdAt && (
          <div className="flex items-center gap-2">
            <Calendar className={cn('w-4 h-4', colorClasses.iconColor)} />
            <span className="text-gray-500 dark:text-gray-500 text-xs">
              Created{' '}
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
        )}

        {lastActivity && (
          <div className="pt-2 border-t border-current/10">
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Last reviewed{' '}
              {formatDistanceToNow(new Date(lastActivity), {
                addSuffix: true,
              })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
