'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TagForm({
  subjectId,
  onTagCreated,
}: {
  subjectId: string;
  onTagCreated?: (tag: any) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subjectId, name: name.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? 'Failed to create tag');

      setName('');

      if (onTagCreated) {
        onTagCreated(j.data);
      }

      toast.success('Tag created successfully');
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
      toast.error('Failed to create tag');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-3">
      <Input
        className="w-64"
        placeholder="e.g. Circle theorems"
        value={name}
        onChange={e => setName(e.target.value)}
        disabled={busy}
        required
      />
      <Button type="submit" disabled={busy} className="">
        {busy && <Loader2Icon className="animate-spin" />}
        {busy ? 'Adding…' : 'Add'}
      </Button>
      {err && <span className="text-sm text-destructive">{err}</span>}
    </form>
  );
}
