'use client';

import { useState, useLayoutEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MathText from '@/components/ui/math-text';
import { useTranslations } from 'next-intl';
import { AnswerInputProps } from '@/lib/types';
import type { MCQAnswerConfig, MCQChoice } from '@/lib/types';

export default function AnswerInput({
  problemType,
  answerConfig,
  value,
  onChange,
  onSubmit,
  disabled = false,
  hideChoiceIds = false,
}: AnswerInputProps) {
  const t = useTranslations('Problems');
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Derive stable primitives from answerConfig so the effect re-runs only
  // when choices content or the randomize setting actually change — not on
  // every render due to new object references from JSON parsing.
  const choicesJson =
    answerConfig?.type === 'mcq'
      ? JSON.stringify((answerConfig as MCQAnswerConfig).choices)
      : null;
  const shouldRandomize =
    answerConfig?.type === 'mcq' &&
    (answerConfig as MCQAnswerConfig).randomize_choices !== false;

  // Initialize with original order to avoid SSR/client hydration mismatch.
  // Component is keyed by problem ID, so each problem gets a fresh mount.
  const [shuffledChoices, setShuffledChoices] = useState<MCQChoice[]>(() => {
    if (answerConfig?.type === 'mcq') {
      return (answerConfig as MCQAnswerConfig).choices;
    }
    return [];
  });

  // Shuffle on client only to prevent hydration mismatch.
  // useLayoutEffect doesn't run during SSR, so server and client initial
  // renders match (original order). Once JS hydrates, the shuffle applies
  // before the next paint — but on slow connections the server-rendered
  // (unshuffled) HTML may be briefly visible before hydration.
  // Deps use stable primitives so this also handles answerConfig changes
  // from router.refresh() / revalidation without remount.
  useLayoutEffect(() => {
    if (!choicesJson) return;
    const choices: MCQChoice[] = JSON.parse(choicesJson);
    if (!shouldRandomize) {
      setShuffledChoices(choices);
      return;
    }
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    setShuffledChoices(choices);
  }, [choicesJson, shouldRandomize]);

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
            placeholder={t('typeYourAnswer')}
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
            placeholder={t('typeYourAnswer')}
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
            placeholder={t('writeResponse')}
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
