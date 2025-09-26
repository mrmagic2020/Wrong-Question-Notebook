'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function SubjectForm() {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Failed to create subject');
      }
      setName('');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-3">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. Mathematics"
        className="w-64 rounded-md border px-3 py-2"
        required
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {busy ? 'Adding…' : 'Add'}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
