'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function UserSearchBar({ value, onChange }: UserSearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocalValue(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 300);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search users by name or username..."
        value={localValue}
        onChange={e => handleChange(e.target.value)}
        className="pl-9 pr-9 rounded-xl border-amber-200/40 dark:border-stone-700 bg-white/80 dark:bg-stone-900/50"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => handleChange('')}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
