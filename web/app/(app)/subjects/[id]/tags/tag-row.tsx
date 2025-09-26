'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TagRow({ tag }: { tag: any }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/tags/${tag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? 'Update failed');
      setEditing(false);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete tag "${tag.name}"?`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/tags/${tag.id}`, {
        method: 'DELETE',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? 'Delete failed');
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-t">
      <td className="px-4 py-2 align-middle">
        {editing ? (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="rounded-md border px-2 py-1"
          />
        ) : (
          <span>{tag.name}</span>
        )}
        {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
      </td>
      <td className="px-4 py-2 align-middle">
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={busy}
                className="rounded-md bg-black px-3 py-1 text-white disabled:opacity-60"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-md border px-3 py-1"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border px-3 py-1"
              >
                Rename
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="rounded-md border px-3 py-1 text-red-600 disabled:opacity-60"
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
