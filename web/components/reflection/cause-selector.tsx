'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ATTEMPT_CONSTANTS } from '@/lib/constants';
import type { TranslatorProp } from '@/i18n/types';

interface CauseSelectorProps {
  value: string | undefined;
  onChange: (value: string) => void;
  isCorrect: boolean;
  onOtherSelected?: () => void;
  t?: TranslatorProp;
}

export default function CauseSelector({
  value,
  onChange,
  isCorrect,
  onOtherSelected,
  t = ((key: string) => key) as TranslatorProp,
}: CauseSelectorProps) {
  const categories = isCorrect
    ? ATTEMPT_CONSTANTS.CAUSE_CATEGORIES.CORRECT
    : ATTEMPT_CONSTANTS.CAUSE_CATEGORIES.INCORRECT;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {isCorrect ? t('howDidYouGetRight') : t('whatWentWrong')}
      </label>
      <Select
        value={value || ''}
        onValueChange={v => {
          onChange(v);
          if (v === 'other') onOtherSelected?.();
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('selectReason')} />
        </SelectTrigger>
        <SelectContent>
          {categories.map(cat => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
