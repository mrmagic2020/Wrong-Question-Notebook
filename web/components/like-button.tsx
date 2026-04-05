'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onToggle: () => void;
  disabled?: boolean;
  isAuthenticated: boolean;
  loading?: boolean;
}

export function LikeButton({
  liked,
  count,
  onToggle,
  disabled,
  isAuthenticated,
  loading,
}: LikeButtonProps) {
  if (!isAuthenticated) {
    return (
      <Tooltip content="Log in to like this set">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          disabled
        >
          <Heart className="h-4 w-4" />
          <span className="text-sm tabular-nums">{count}</span>
        </Button>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={liked ? 'Unlike' : 'Like'}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        disabled={disabled || loading}
        className={cn(
          'gap-1.5 transition-colors hover:bg-amber-100/60 dark:hover:bg-amber-900/20',
          liked
            ? 'text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300'
            : 'text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400'
        )}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-all',
            liked && 'fill-current scale-110'
          )}
        />
        <span className="text-sm tabular-nums">{count}</span>
      </Button>
    </Tooltip>
  );
}
