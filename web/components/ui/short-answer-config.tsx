'use client';

import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { ANSWER_CONFIG_CONSTANTS } from '@/lib/constants';

type ShortAnswerMode = 'text' | 'numeric';

interface TextConfig {
  mode: 'text';
  acceptable_answers: string[];
}

interface NumericConfig {
  mode: 'numeric';
  numeric_config: {
    correct_value: number | '';
    tolerance: number | '';
    unit?: string;
  };
}

type ShortAnswerConfigValue = TextConfig | NumericConfig;

interface ShortAnswerConfigProps {
  value: ShortAnswerConfigValue;
  onChange: (value: ShortAnswerConfigValue) => void;
  disabled?: boolean;
}

export function ShortAnswerConfig({
  value,
  onChange,
  disabled = false,
}: ShortAnswerConfigProps) {
  const { MAX_ACCEPTABLE_ANSWERS, MAX_ANSWER_LENGTH, NUMERIC } =
    ANSWER_CONFIG_CONSTANTS.SHORT_ANSWER;

  const [newAnswer, setNewAnswer] = useState('');

  const mode = value.mode;

  const handleModeChange = useCallback(
    (newMode: ShortAnswerMode) => {
      if (newMode === 'text') {
        onChange({ mode: 'text', acceptable_answers: [] });
      } else {
        onChange({
          mode: 'numeric',
          numeric_config: { correct_value: '', tolerance: '', unit: '' },
        });
      }
    },
    [onChange]
  );

  const addAnswer = useCallback(() => {
    if (value.mode !== 'text') return;
    const trimmed = newAnswer.trim();
    if (!trimmed) return;
    if (value.acceptable_answers.length >= MAX_ACCEPTABLE_ANSWERS) return;
    if (
      value.acceptable_answers.some(
        a => a.toLowerCase() === trimmed.toLowerCase()
      )
    )
      return;
    onChange({
      ...value,
      acceptable_answers: [...value.acceptable_answers, trimmed],
    });
    setNewAnswer('');
  }, [value, newAnswer, onChange, MAX_ACCEPTABLE_ANSWERS]);

  const removeAnswer = useCallback(
    (index: number) => {
      if (value.mode !== 'text') return;
      onChange({
        ...value,
        acceptable_answers: value.acceptable_answers.filter(
          (_, i) => i !== index
        ),
      });
    },
    [value, onChange]
  );

  return (
    <div className="space-y-3">
      <div className="form-row">
        <label className="form-label">Answer mode</label>
        <div className="inline-flex self-start rounded-lg border border-border p-0.5">
          <button
            type="button"
            onClick={() => handleModeChange('text')}
            disabled={disabled}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              mode === 'text'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Text
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('numeric')}
            disabled={disabled}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              mode === 'numeric'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Numeric
          </button>
        </div>
      </div>

      {mode === 'text' && value.mode === 'text' && (
        <div className="form-row-start">
          <label className="form-label pt-2">Acceptable answers</label>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">
              All answers will be matched case-insensitively
            </p>
            {/* Tags display */}
            {value.acceptable_answers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {value.acceptable_answers.map((answer, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-200/50 bg-amber-100/80 px-3 py-1 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/30 dark:text-amber-300"
                  >
                    {answer}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeAnswer(i)}
                        className="ml-0.5 text-amber-600 hover:text-red-500 dark:text-amber-400 dark:hover:text-red-400"
                        aria-label="Remove acceptable answer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            {/* Add new answer */}
            {value.acceptable_answers.length < MAX_ACCEPTABLE_ANSWERS && (
              <div className="flex gap-2">
                <Input
                  value={newAnswer}
                  onChange={e => setNewAnswer(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAnswer();
                    }
                  }}
                  placeholder="Type an acceptable answer and press Enter"
                  maxLength={MAX_ANSWER_LENGTH}
                  disabled={disabled}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAnswer}
                  disabled={disabled || !newAnswer.trim()}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'numeric' && value.mode === 'numeric' && (
        <div className="form-row-start">
          <label className="form-label pt-2">Numeric answer</label>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">
              Define correct value with tolerance
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Correct value
                </label>
                <Input
                  type="number"
                  step="any"
                  value={value.numeric_config.correct_value}
                  onChange={e =>
                    onChange({
                      ...value,
                      numeric_config: {
                        ...value.numeric_config,
                        correct_value:
                          e.target.value === '' ? '' : Number(e.target.value),
                      },
                    })
                  }
                  placeholder="e.g. 3.14"
                  disabled={disabled}
                  className="w-32"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Tolerance (+/-)
                </label>
                <Input
                  type="number"
                  step="any"
                  min={NUMERIC.MIN_TOLERANCE}
                  value={value.numeric_config.tolerance}
                  onChange={e =>
                    onChange({
                      ...value,
                      numeric_config: {
                        ...value.numeric_config,
                        tolerance:
                          e.target.value === '' ? '' : Number(e.target.value),
                      },
                    })
                  }
                  placeholder="e.g. 0.01"
                  disabled={disabled}
                  className="w-32"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Unit (optional)
                </label>
                <Input
                  value={value.numeric_config.unit || ''}
                  onChange={e =>
                    onChange({
                      ...value,
                      numeric_config: {
                        ...value.numeric_config,
                        unit: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="e.g. m, kg"
                  maxLength={NUMERIC.MAX_UNIT_LENGTH}
                  disabled={disabled}
                  className="w-28"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { ShortAnswerConfigValue, TextConfig, NumericConfig };
