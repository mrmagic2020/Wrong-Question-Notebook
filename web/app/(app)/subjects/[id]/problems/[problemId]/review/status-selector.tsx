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
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  {
    value: 'needs_review',
    label: 'Needs Review',
    description: 'I need to review this problem',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  {
    value: 'mastered',
    label: 'Mastered',
    description: 'I have mastered this problem',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
];

export default function StatusSelector({
  currentStatus,
  onStatusChange,
}: StatusSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Update the status of this problem based on your performance:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {statusOptions.map(option => (
          <label
            key={option.value}
            className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
              currentStatus === option.value
                ? `${option.color} border-current`
                : 'border-gray-200 hover:border-gray-300'
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
              <div className="text-xs text-gray-600 mt-1">
                {option.description}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
