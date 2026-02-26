import React from 'react';
import { Button } from '@/components/ui/button';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
  shortcut?: string;
}

export function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
  shortcut,
}: ToolbarButtonProps) {
  const fullTitle = shortcut ? `${title} (${shortcut})` : title;

  return (
    <Button
      type="button"
      variant={isActive ? 'default' : 'ghost'}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={fullTitle}
      className="h-8 w-8 p-0"
    >
      {children}
    </Button>
  );
}
