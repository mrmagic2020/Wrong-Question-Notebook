'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2Icon } from 'lucide-react';

export default function SubjectForm({
  onSubjectCreated,
}: {
  onSubjectCreated?: (subject: any) => void;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Failed to create subject');
      }

      const newSubject = await res.json();
      setName('');

      if (onSubjectCreated) {
        onSubjectCreated(newSubject.data);
      }

      toast.success('Subject created successfully');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to create subject');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-3">
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. Mathematics"
        disabled={busy}
        className="w-64"
        required
      />
      <Button
        type="submit"
        disabled={busy}
      >
        {busy && <Loader2Icon className="animate-spin" />}
        {busy ? 'Adding...' : 'Add'}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </form>
  );
}
