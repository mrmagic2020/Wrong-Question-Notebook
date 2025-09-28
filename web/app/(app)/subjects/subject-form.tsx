'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SubjectForm({ onSubjectCreated }: { onSubjectCreated?: (subject: any) => void }) {
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
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. Mathematics"
        disabled={busy}
        className="w-64 rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        required
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center gap-2"
      >
        {busy && (
          <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        )}
        {busy ? 'Adding…' : 'Add'}
      </button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </form>
  );
}
