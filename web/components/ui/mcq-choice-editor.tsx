'use client';

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ANSWER_CONFIG_CONSTANTS } from '@/lib/constants';
import type { MCQChoice } from '@/lib/types';

interface MCQChoiceEditorProps {
  choices: MCQChoice[];
  correctChoiceId: string;
  onChoicesChange: (choices: MCQChoice[]) => void;
  onCorrectChoiceChange: (choiceId: string) => void;
  disabled?: boolean;
}

export function MCQChoiceEditor({
  choices,
  correctChoiceId,
  onChoicesChange,
  onCorrectChoiceChange,
  disabled = false,
}: MCQChoiceEditorProps) {
  const { MIN_CHOICES, MAX_CHOICES, MAX_CHOICE_TEXT_LENGTH } =
    ANSWER_CONFIG_CONSTANTS.MCQ;

  const handleTextChange = useCallback(
    (id: string, text: string) => {
      onChoicesChange(choices.map(c => (c.id === id ? { ...c, text } : c)));
    },
    [choices, onChoicesChange]
  );

  const addChoice = useCallback(() => {
    if (choices.length >= MAX_CHOICES) return;
    // Generate next letter ID
    const usedIds = new Set(choices.map(c => c.id));
    let nextId = '';
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      if (!usedIds.has(letter)) {
        nextId = letter;
        break;
      }
    }
    if (!nextId) nextId = String(choices.length + 1);
    onChoicesChange([...choices, { id: nextId, text: '' }]);
  }, [choices, onChoicesChange, MAX_CHOICES]);

  const removeChoice = useCallback(
    (id: string) => {
      if (choices.length <= MIN_CHOICES) return;
      const updated = choices.filter(c => c.id !== id);
      onChoicesChange(updated);
      // If we removed the correct choice, clear the selection
      if (correctChoiceId === id) {
        onCorrectChoiceChange('');
      }
    },
    [
      choices,
      correctChoiceId,
      onChoicesChange,
      onCorrectChoiceChange,
      MIN_CHOICES,
    ]
  );

  return (
    <div className="form-row-start">
      <label className="form-label pt-2">Answer choices</label>
      <div className="flex-1 space-y-3">
        <div className="space-y-2">
          {choices.map(choice => {
            const isCorrect = choice.id === correctChoiceId;
            return (
              <div
                key={choice.id}
                className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${
                  isCorrect
                    ? 'border-amber-500 bg-amber-50/80 dark:border-amber-600 dark:bg-amber-950/30'
                    : 'border-border bg-background'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onCorrectChoiceChange(choice.id)}
                  disabled={disabled}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                    isCorrect
                      ? 'border-amber-500 bg-amber-500 text-white dark:border-amber-400 dark:bg-amber-400 dark:text-gray-900'
                      : 'border-gray-300 text-gray-400 hover:border-amber-300 dark:border-gray-600 dark:text-gray-500 dark:hover:border-amber-600'
                  }`}
                  title={
                    isCorrect ? 'Correct answer' : 'Click to mark as correct'
                  }
                >
                  {choice.id}
                </button>
                <Input
                  value={choice.text}
                  onChange={e => handleTextChange(choice.id, e.target.value)}
                  placeholder={`Option ${choice.id}...`}
                  maxLength={MAX_CHOICE_TEXT_LENGTH}
                  disabled={disabled}
                  className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                {choices.length > MIN_CHOICES && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChoice(choice.id)}
                    disabled={disabled}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {choices.length < MAX_CHOICES && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addChoice}
            disabled={disabled}
            className="text-muted-foreground"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add choice
          </Button>
        )}
        {!correctChoiceId && choices.length > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Click a letter to mark the correct answer
          </p>
        )}
      </div>
    </div>
  );
}
