'use client';

import { useTranslations } from 'next-intl';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FavouriteButtonProps {
  favourited: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isAuthenticated: boolean;
  loading?: boolean;
}

export function FavouriteButton({
  favourited,
  onToggle,
  disabled,
  isAuthenticated,
  loading,
}: FavouriteButtonProps) {
  const t = useTranslations('Social');
  if (!isAuthenticated) {
    return (
      <Tooltip content={t('loginToSave')}>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          disabled
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      content={favourited ? t('removeFromFavourites') : t('addToFavourites')}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        disabled={disabled || loading}
        className={cn(
          'transition-colors hover:bg-amber-100/60 dark:hover:bg-amber-900/20',
          favourited
            ? 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300'
            : 'text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400'
        )}
      >
        <Bookmark
          className={cn('h-4 w-4 transition-all', favourited && 'fill-current')}
        />
      </Button>
    </Tooltip>
  );
}
