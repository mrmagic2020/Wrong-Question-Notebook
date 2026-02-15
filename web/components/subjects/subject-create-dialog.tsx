'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconPicker } from '@/components/ui/icon-picker';
import { ColorPicker } from '@/components/ui/color-picker';
import { Spinner } from '@/components/ui/spinner';
import { SubjectWithMetadata } from '@/lib/types';
import { useSubjectForm } from '@/lib/hooks/useSubjectForm';

interface SubjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSubjects: Array<{ color?: string }>;
  onSuccess: (created: SubjectWithMetadata) => void;
}

export function SubjectCreateDialog({
  open,
  onOpenChange,
  existingSubjects,
  onSuccess,
}: SubjectCreateDialogProps) {
  const {
    name,
    color,
    icon,
    busy,
    setName,
    setColor,
    setIcon,
    handleSubmit,
    resetForm,
  } = useSubjectForm({
    existingSubjects,
    onSuccess: subject => {
      onSuccess(subject);
      onOpenChange(false);
    },
    resetOnSuccess: false, // We'll reset manually when dialog closes
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Subject</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Subject Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Mathematics"
              disabled={busy}
              className="mt-2"
              required
              autoFocus
            />
          </div>
          <div>
            <Label>Icon</Label>
            <div className="mt-2">
              <IconPicker value={icon} onChange={setIcon} disabled={busy} />
            </div>
          </div>
          <div>
            <Label>Color</Label>
            <div className="mt-2">
              <ColorPicker value={color} onChange={setColor} disabled={busy} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Spinner />}
              {busy ? 'Creating...' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
