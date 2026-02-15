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
import {
  SUBJECT_CONSTANTS,
  getNextSubjectColor,
  suggestIconForSubject,
  SubjectColor,
  SubjectIcon,
} from '@/lib/constants';

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
  const [name, setName] = useState('');
  const [color, setColor] = useState<SubjectColor>(
    SUBJECT_CONSTANTS.DEFAULT_COLOR
  );
  const [icon, setIcon] = useState<SubjectIcon>(SUBJECT_CONSTANTS.DEFAULT_ICON);
  const [busy, setBusy] = useState(false);

  // Auto-suggest icon when name changes
  useEffect(() => {
    if (name.trim()) {
      setIcon(suggestIconForSubject(name));
    }
  }, [name]);

  // Auto-rotate color when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setColor(getNextSubjectColor(existingSubjects));
      setIcon(SUBJECT_CONSTANTS.DEFAULT_ICON);
    }
  }, [open, existingSubjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color, icon }),
      });
      if (!res.ok) throw new Error('Failed to create subject');

      const result = await res.json();
      toast.success('Subject created');
      onSuccess(result.data);
      onOpenChange(false);
    } catch {
      toast.error('Failed to create subject');
    } finally {
      setBusy(false);
    }
  };

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
