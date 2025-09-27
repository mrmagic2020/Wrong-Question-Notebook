'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function TagForm({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subjectId, name }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? 'Failed to create tag');
      setName('');
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-3">
      <input
        className="w-64 rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        placeholder="e.g. Circle theorems"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {busy ? 'Adding…' : 'Add'}
      </button>
      {err && <span className="text-sm text-destructive">{err}</span>}
    </form>
  );
}
