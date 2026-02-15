'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  SUBJECT_CONSTANTS,
  SubjectIcon,
  getIconComponent,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value: string;
  onChange: (icon: SubjectIcon) => void;
  disabled?: boolean;
}

export function IconPicker({ value, onChange, disabled }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const IconComponent = getIconComponent(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="w-16 h-16 p-0"
          aria-label="Select icon"
        >
          <IconComponent className="w-6 h-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2">
        <div className="grid grid-cols-5 gap-2">
          {SUBJECT_CONSTANTS.ICONS.map(iconName => {
            const Icon = getIconComponent(iconName);
            return (
              <Button
                key={iconName}
                variant="ghost"
                size="icon"
                onClick={() => {
                  onChange(iconName);
                  setOpen(false);
                }}
                className={cn('h-12 w-12', value === iconName && 'bg-accent')}
                aria-label={iconName}
              >
                <Icon className="w-5 h-5" />
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
