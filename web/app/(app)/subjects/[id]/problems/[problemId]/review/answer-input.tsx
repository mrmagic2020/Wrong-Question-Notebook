'use client';

import { ProblemType } from '@/lib/schemas';
import { Input } from '@/components/ui/input';

interface AnswerInputProps {
  problemType: ProblemType;
  correctAnswer?: any;
  value: any;
  onChange: (value: any) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export default function AnswerInput({
  problemType,
  value,
  onChange,
  onSubmit,
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  switch (problemType) {
    case 'mcq':
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Enter your answer:</p>
          <Input
            type="text"
            value={value || ''}
            onChange={e => handleMcqChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type your answer here..."
          />
        </div>
      );

    case 'short':
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Enter your answer:</p>
          <Input
            type="text"
            value={value || ''}
            onChange={e => handleShortAnswerChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type your answer here..."
          />
        </div>
      );

    case 'extended':
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Write your response:</p>
          <textarea
            value={value || ''}
            onChange={e => handleExtendedResponseChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Write your detailed response here..."
            rows={6}
            className="w-full px-3 py-2 border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed resize-vertical"
          />
        </div>
      );

    default:
      return (
        <div className="text-muted-foreground text-sm">
          No answer input available for this problem type.
        </div>
      );
  }
}
