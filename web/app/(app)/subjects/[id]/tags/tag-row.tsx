'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { TagRowProps } from '@/lib/types';

export default function TagRow({
  tag,
  onTagDeleted,
  onTagUpdated,
  showConfirmation,
}: TagRowProps) {
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
          <Input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
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
              <Button onClick={save} disabled={busy} className="">
                {busy && <Spinner />}
                {busy ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={() => {
                  setEditing(false);
                  setName(tag.name); // Reset to original name
                }}
                disabled={busy}
                variant="secondary"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setEditing(true)}
                disabled={busy}
                variant="outline"
              >
                Rename
              </Button>
              <Button
                onClick={handleRemove}
                disabled={busy}
                variant="destructive"
              >
                {busy && <Spinner />}
                Delete
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
