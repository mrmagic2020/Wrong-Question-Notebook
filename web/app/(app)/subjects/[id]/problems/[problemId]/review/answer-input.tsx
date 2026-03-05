'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MathText from '@/components/ui/math-text';
import { AnswerInputProps } from '@/lib/types';
import type { MCQAnswerConfig } from '@/lib/types';

export default function AnswerInput({
  problemType,
  answerConfig,
  value,
  onChange,
  onSubmit,
  disabled = false,
  hideChoiceIds = false,
}: AnswerInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Stable shuffled choices — computed once per mount via useState initializer.
  // Component is keyed by problem ID, so each problem visit gets a fresh shuffle.
  const [shuffledChoices] = useState(() => {
    if (answerConfig?.type === 'mcq') {
      const config = answerConfig as MCQAnswerConfig;
      if (config.randomize_choices === false) return config.choices;
      const choices = [...config.choices];
      for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
      }
      return choices;
    }
    return [];
  });

  // Enhanced MCQ: radio buttons with choice text
  if (problemType === 'mcq' && answerConfig && answerConfig.type === 'mcq') {
    return (
      <div className="space-y-2">
        {shuffledChoices.map(choice => {
          const isSelected = value === choice.id;
          return (
            <label
              key={choice.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/80 dark:border-amber-600 dark:bg-amber-950/30'
                  : 'border-border bg-background hover:border-amber-200 dark:hover:border-amber-800'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <input
                type="radio"
                name="mcq-answer"
                value={choice.id}
                checked={isSelected}
                onChange={() => onChange(choice.id)}
                disabled={disabled}
                className="sr-only"
              />
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500 text-white dark:border-amber-400 dark:bg-amber-400 dark:text-gray-900'
                    : 'border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500'
                }`}
              >
                {hideChoiceIds ? (
                  <span
                    className={`block h-6 w-6 rounded-full transition-colors ${
                      isSelected
                        ? 'bg-white dark:bg-gray-900'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ) : (
                  choice.id
                )}
              </span>
              {choice.text && (
                <span className="text-sm text-foreground">
                  <MathText text={choice.text} />
                </span>
              )}
            </label>
          );
        })}
      </div>
    );
  }

  switch (problemType) {
    case 'mcq':
      return (
        <div className="space-y-2">
          <Input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type your answer here..."
          />
        </div>
      );

    case 'short':
      return (
        <div className="space-y-2">
          <Input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type your answer here..."
          />
        </div>
      );

    case 'extended':
      return (
        <div className="space-y-2">
          <Textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
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
