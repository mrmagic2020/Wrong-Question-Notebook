'use client';

import { ProblemStatus } from '@/lib/schemas';

interface StatusSelectorProps {
  currentStatus: ProblemStatus;
  onStatusChange: (status: ProblemStatus) => void;
}

const statusOptions: {
  value: ProblemStatus;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    value: 'wrong',
    label: 'Wrong',
    description: 'I got this problem wrong',
    color:
      'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
  },
  {
    value: 'needs_review',
    label: 'Needs Review',
    description: 'I need to review this problem',
    color:
      'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
  },
  {
    value: 'mastered',
    label: 'Mastered',
    description: 'I have mastered this problem',
    color:
      'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
  },
];

export default function StatusSelector({
  currentStatus,
  onStatusChange,
}: StatusSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Update the status of this problem based on your performance:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {statusOptions.map(option => (
          <label
            key={option.value}
            className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
              currentStatus === option.value
                ? `${option.color} border-current`
                : 'border-border hover:border-border/80'
            }`}
          >
            <input
              type="radio"
              name="problem-status"
              value={option.value}
              checked={currentStatus === option.value}
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
