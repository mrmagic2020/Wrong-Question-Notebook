'use client';

import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { SUBJECT_CONSTANTS } from '@/lib/constants';

interface SubjectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: SubjectWithMetadata;
  onSuccess: (updated: SubjectWithMetadata) => void;
}

export function SubjectEditDialog({
  open,
  onOpenChange,
  subject,
  onSuccess,
}: SubjectEditDialogProps) {
  const [name, setName] = useState(subject.name);
  const [color, setColor] = useState(
    subject.color || SUBJECT_CONSTANTS.DEFAULT_COLOR
  );
  const [icon, setIcon] = useState(
    subject.icon || SUBJECT_CONSTANTS.DEFAULT_ICON
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(subject.name);
      setColor(subject.color || SUBJECT_CONSTANTS.DEFAULT_COLOR);
      setIcon(subject.icon || SUBJECT_CONSTANTS.DEFAULT_ICON);
    }
  }, [open, subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color, icon }),
      });
      if (!res.ok) throw new Error('Failed to update');

      const result = await res.json();
      toast.success('Subject updated');
      onSuccess(result.data);
      onOpenChange(false);
    } catch {
      toast.error('Failed to update subject');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Subject Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={busy}
              className="mt-2"
              required
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
              {busy ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
