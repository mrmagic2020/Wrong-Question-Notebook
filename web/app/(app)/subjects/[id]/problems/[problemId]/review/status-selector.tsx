'use client';

import { ProblemStatus } from '@/lib/schemas';
import { StatusSelectorProps } from '@/lib/types';
import { XCircle, AlertCircle, CheckCircle } from 'lucide-react';

const statusOptions: {
  value: ProblemStatus;
  label: string;
  description: string;
  color: string;
  icon: typeof XCircle;
}[] = [
  {
    value: 'wrong',
    label: 'Wrong',
    description: 'I got this problem wrong',
    color:
      'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
    icon: XCircle,
  },
  {
    value: 'needs_review',
    label: 'Needs Review',
    description: 'I still need to review this problem',
    color:
      'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    icon: AlertCircle,
  },
  {
    value: 'mastered',
    label: 'Mastered',
    description: 'I have mastered this problem',
    color:
      'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
    icon: CheckCircle,
  },
];

export default function StatusSelector({
  currentStatus,
  selectedStatus,
  onStatusChange,
  compact = false,
}: StatusSelectorProps) {
  if (compact) {
    const getHoverClass = (value: ProblemStatus) => {
      switch (value) {
        case 'wrong':
          return 'hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/10 dark:hover:border-red-900/30';
        case 'needs_review':
          return 'hover:bg-yellow-50 hover:border-yellow-200 dark:hover:bg-yellow-950/10 dark:hover:border-yellow-900/30';
        case 'mastered':
          return 'hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950/10 dark:hover:border-green-900/30';
        default:
          return 'hover:bg-muted';
      }
    };

    return (
      <div>
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
          Status
        </h3>
        <div className="space-y-1.5">
          {statusOptions.map(option => {
            const Icon = option.icon;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => onStatusChange(option.value)}
                className={`w-full px-3 py-2 rounded-lg text-left text-sm font-medium border transition-all flex items-center gap-2 ${
                  selectedStatus === option.value
                    ? option.color + ' border-current'
                    : `border-border bg-background ${getHoverClass(option.value)}`
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Current:{' '}
          <span className="font-medium">{currentStatus.replace('_', ' ')}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Update the status of this problem based on your performance:
        </p>
        <p className="text-xs text-muted-foreground">
          Current:{' '}
          <span className="font-medium">{currentStatus.replace('_', ' ')}</span>
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {statusOptions.map(option => (
          <label
            key={option.value}
            className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
              selectedStatus === option.value
                ? `${option.color} border-current`
                : 'border-border hover:border-border/80'
            }`}
          >
            <input
              type="radio"
              name="problem-status"
              value={option.value}
              checked={selectedStatus === option.value}
              onChange={e => onStatusChange(e.target.value as ProblemStatus)}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {option.description}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
