'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function TagForm({ 
  subjectId, 
  onTagCreated 
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
      <input
        className="w-64 rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="e.g. Circle theorems"
        value={name}
        onChange={e => setName(e.target.value)}
        disabled={busy}
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
      {err && <span className="text-sm text-destructive">{err}</span>}
    </form>
  );
}
