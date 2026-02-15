'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconPicker } from '@/components/ui/icon-picker';
import { ColorPicker } from '@/components/ui/color-picker';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { SubjectFormProps } from '@/lib/types';
import {
  SUBJECT_CONSTANTS,
  getNextSubjectColor,
  suggestIconForSubject,
  SubjectColor,
  SubjectIcon,
} from '@/lib/constants';

export default function SubjectForm({
  onSubjectCreated,
  existingSubjects = [],
}: SubjectFormProps & { existingSubjects?: Array<{ color?: string }> }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<SubjectColor>(
    SUBJECT_CONSTANTS.DEFAULT_COLOR
  );
  const [icon, setIcon] = useState<SubjectIcon>(SUBJECT_CONSTANTS.DEFAULT_ICON);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  // Auto-suggest icon when name changes
  useEffect(() => {
    if (name.trim()) {
      setIcon(suggestIconForSubject(name));
    }
  }, [name]);

  // Auto-rotate color on mount
  useEffect(() => {
    setColor(getNextSubjectColor(existingSubjects));
  }, [existingSubjects]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a subject name');
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
      setName('');
      setColor(getNextSubjectColor([...existingSubjects, result.data]));
      setIcon(SUBJECT_CONSTANTS.DEFAULT_ICON);

      onSubjectCreated?.(result.data);
      toast.success('Subject created');
      router.refresh();
    } catch {
      toast.error('Failed to create subject');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>Subject Name</Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Mathematics"
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
      <Button type="submit" disabled={busy}>
        {busy && <Spinner />}
        {busy ? 'Adding...' : 'Add Subject'}
      </Button>
    </form>
  );
}
