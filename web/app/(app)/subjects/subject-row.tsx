'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubjectRow({ subject }: { subject: any }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(subject.name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Update failed');
      }
      setEditing(false);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete subject "${subject.name}"?`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Delete failed');
      }
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2 align-middle">
        {editing ? (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        ) : (
          <span className="text-foreground">{subject.name}</span>
        )}
        {err && <div className="text-xs text-destructive mt-1">{err}</div>}
      </td>
      <td className="px-4 py-2 align-middle">
        <div className="flex gap-2">
          <Link
            href={`/subjects/${subject.id}/problems`}
            className="rounded-md border border-border bg-background px-3 py-1 text-foreground hover:bg-muted transition-colors"
          >
            Problems
          </Link>
          <Link
            href={`/subjects/${subject.id}/tags`}
            className="rounded-md border border-border bg-background px-3 py-1 text-foreground hover:bg-muted transition-colors"
          >
            Tags
          </Link>
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={busy}
                className="rounded-md bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-md border border-border bg-background px-3 py-1 text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border border-border bg-background px-3 py-1 text-foreground hover:bg-muted transition-colors"
              >
                Rename
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="rounded-md border border-destructive bg-destructive/10 dark:bg-destructive/20 px-3 py-1 text-destructive dark:text-red-400 hover:bg-destructive/20 dark:hover:bg-destructive/30 disabled:opacity-60 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
