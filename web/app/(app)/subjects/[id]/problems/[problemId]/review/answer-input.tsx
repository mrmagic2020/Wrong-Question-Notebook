'use client';

import { ProblemType } from '@/lib/schemas';

interface AnswerInputProps {
  problemType: ProblemType;
  correctAnswer?: any;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export default function AnswerInput({
  problemType,
  correctAnswer,
  value,
  onChange,
  disabled = false,
}: AnswerInputProps) {
  const handleMcqChange = (choice: string) => {
    onChange(choice);
  };

  const handleShortAnswerChange = (text: string) => {
    onChange(text);
  };

  const handleExtendedResponseChange = (text: string) => {
    onChange(text);
  };

  switch (problemType) {
    case 'mcq':
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Enter your answer:</p>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleMcqChange(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      );

    case 'short':
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Enter your answer:</p>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleShortAnswerChange(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      );

    case 'extended':
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Write your response:</p>
          <textarea
            value={value || ''}
            onChange={(e) => handleExtendedResponseChange(e.target.value)}
            disabled={disabled}
            placeholder="Write your detailed response here..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical"
          />
        </div>
      );

    default:
      return (
        <div className="text-gray-500 text-sm">
          No answer input available for this problem type.
        </div>
      );
  }
}
