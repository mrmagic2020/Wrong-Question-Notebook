'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

export default function TagRow({
  tag,
  onTagDeleted,
  onTagUpdated,
  showConfirmation,
}: {
  tag: any;
  onTagDeleted?: (tagId: string) => void;
  onTagUpdated?: (tag: any) => void;
  showConfirmation?: (config: any) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditing(false);
      setName(tag.name); // Reset to original name
    }
  };

  async function save() {
    if (!name.trim()) {
      setErr('Name cannot be empty');
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/tags/${tag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? 'Update failed');

      const updatedTag = { ...tag, name: name.trim() };
      if (onTagUpdated) {
        onTagUpdated(updatedTag);
      }

      setEditing(false);
      toast.success('Tag renamed successfully');
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
      toast.error('Failed to rename tag');
    } finally {
      setBusy(false);
    }
  }

  const handleRemove = () => {
    if (showConfirmation) {
      showConfirmation({
        title: 'Delete Tag',
        message: `Are you sure you want to delete "${tag.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          setBusy(true);
          setErr(null);
          try {
            const res = await fetch(`/api/tags/${tag.id}`, {
              method: 'DELETE',
            });
            const j = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(j?.error ?? 'Delete failed');

            if (onTagDeleted) {
              onTagDeleted(tag.id);
            }

            toast.success('Tag deleted successfully');
            router.refresh();
          } catch (e: any) {
            setErr(e.message);
            toast.error('Failed to delete tag');
          } finally {
            setBusy(false);
          }
        },
      });
    } else {
      // Fallback to browser confirm if showConfirmation is not available
      if (
        confirm(
          `Are you sure you want to delete "${tag.name}"? This action cannot be undone.`
        )
      ) {
        setBusy(true);
        setErr(null);
        fetch(`/api/tags/${tag.id}`, {
          method: 'DELETE',
        })
          .then(async res => {
            const j = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(j?.error ?? 'Delete failed');

            if (onTagDeleted) {
              onTagDeleted(tag.id);
            }

            toast.success('Tag deleted successfully');
            router.refresh();
          })
          .catch((e: any) => {
            setErr(e.message);
            toast.error('Failed to delete tag');
          })
          .finally(() => {
            setBusy(false);
          });
      }
    }
  };

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2 align-middle">
        {editing ? (
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
            className="rounded-md border border-input bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter tag name"
          />
        ) : (
          <span className="text-foreground">{tag.name}</span>
        )}
        {err && <div className="mt-1 text-xs text-destructive">{err}</div>}
      </td>
      <td className="px-4 py-2 align-middle">
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={busy}
                className="rounded-md bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center gap-1"
              >
                {busy && (
                  <div className="w-3 h-3 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                )}
                {busy ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(tag.name); // Reset to original name
                }}
                disabled={busy}
                className="rounded-md border border-border bg-background px-3 py-1 text-foreground hover:bg-muted disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                disabled={busy}
                className="rounded-md border border-border bg-background px-3 py-1 text-foreground hover:bg-muted disabled:opacity-60 transition-colors"
              >
                Rename
              </button>
              <button
                onClick={handleRemove}
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
