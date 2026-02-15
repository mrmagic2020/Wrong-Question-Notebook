'use client';

import { Button } from '@/components/ui/button';
import { SUBJECT_CONSTANTS, SubjectColor } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: SubjectColor) => void;
  disabled?: boolean;
}

const colorSwatches: Record<SubjectColor, string> = {
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
  teal: 'bg-teal-500',
  pink: 'bg-pink-500',
};

export function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUBJECT_CONSTANTS.COLORS.map(color => (
        <Button
          key={color}
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          onClick={() => onChange(color)}
          className={cn(
            'h-10 w-10 rounded-full p-0',
            value === color && 'ring-2 ring-offset-2 ring-ring'
          )}
          aria-label={`Select ${color} color`}
        >
          <div
            className={cn(
              'h-7 w-7 rounded-full',
              colorSwatches[color as SubjectColor]
            )}
          />
        </Button>
      ))}
    </div>
  );
}
