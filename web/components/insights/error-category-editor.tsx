'use client';

import { useState } from 'react';
import { Pencil, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ERROR_CATEGORY_LABELS, ERROR_CATEGORY_VALUES } from '@/lib/constants';
import type { ErrorCategorisation, ErrorBroadCategory } from '@/lib/types';

interface ErrorCategoryEditorProps {
  categorisation: ErrorCategorisation;
  onSave: (
    id: string,
    updates: { broad_category?: string; granular_tag?: string }
  ) => Promise<void>;
  onReset?: (id: string) => Promise<void>;
}

export function ErrorCategoryEditor({
  categorisation,
  onSave,
  onReset,
}: ErrorCategoryEditorProps) {
  const [open, setOpen] = useState(false);
  const [broadCategory, setBroadCategory] = useState<ErrorBroadCategory>(
    categorisation.broad_category
  );
  const [granularTag, setGranularTag] = useState(categorisation.granular_tag);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Reset form state when dialog opens
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setBroadCategory(categorisation.broad_category);
      setGranularTag(categorisation.granular_tag);
    }
    setOpen(nextOpen);
  }

  const hasChanges =
    broadCategory !== categorisation.broad_category ||
    granularTag !== categorisation.granular_tag;

  async function handleSave() {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const updates: { broad_category?: string; granular_tag?: string } = {};
      if (broadCategory !== categorisation.broad_category) {
        updates.broad_category = broadCategory;
      }
      if (granularTag !== categorisation.granular_tag) {
        updates.granular_tag = granularTag;
      }
      await onSave(categorisation.id, updates);
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    if (!onReset) return;
    setIsResetting(true);
    try {
      await onReset(categorisation.id);
      setOpen(false);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          onClick={e => e.stopPropagation()}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[360px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            Edit Error Classification
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label
              htmlFor="broad-category"
              className="text-xs text-gray-500 dark:text-gray-400"
            >
              Error Type
            </Label>
            <Select
              value={broadCategory}
              onValueChange={v => setBroadCategory(v as ErrorBroadCategory)}
            >
              <SelectTrigger id="broad-category" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ERROR_CATEGORY_VALUES.map(value => (
                  <SelectItem key={value} value={value}>
                    {ERROR_CATEGORY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="granular-tag"
              className="text-xs text-gray-500 dark:text-gray-400"
            >
              Specific Tag
            </Label>
            <Input
              id="granular-tag"
              value={granularTag}
              onChange={e => setGranularTag(e.target.value)}
              placeholder="e.g. sign error in integration"
              className="rounded-xl text-sm"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="rounded-xl text-xs"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
            {categorisation.is_user_override && onReset && (
              <button
                className={cn(
                  'inline-flex items-center gap-1 text-xs',
                  'text-gray-500 hover:text-gray-700',
                  'dark:text-gray-400 dark:hover:text-gray-200',
                  'transition-colors'
                )}
                onClick={handleReset}
                disabled={isResetting}
              >
                <RotateCcw className="h-3 w-3" />
                {isResetting ? 'Resetting...' : 'Reset to AI'}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
