'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Tooltip } from '@/components/ui/tooltip';

export default function SubjectRow({
  subject,
  onSubjectDeleted,
  onSubjectUpdated,
  showConfirmation,
}: {
  subject: any;
  onSubjectDeleted?: (subjectId: string) => void;
  onSubjectUpdated?: (subject: any) => void;
  showConfirmation?: (config: any) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(subject.name);
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
      setName(subject.name); // Reset to original name
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
      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Update failed');
      }

      const updatedSubject = { ...subject, name: name.trim() };
      if (onSubjectUpdated) {
        onSubjectUpdated(updatedSubject);
      }

      setEditing(false);
      toast.success('Subject renamed successfully');
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
      toast.error('Failed to rename subject');
    } finally {
      setBusy(false);
    }
  }

  const handleRemove = () => {
    if (showConfirmation) {
      showConfirmation({
        title: 'Delete Subject',
        message: `Are you sure you want to delete "${subject.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
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

            if (onSubjectDeleted) {
              onSubjectDeleted(subject.id);
            }

            toast.success('Subject deleted successfully');
            router.refresh();
          } catch (e: any) {
            setErr(e.message);
            toast.error('Failed to delete subject');
          } finally {
            setBusy(false);
          }
        },
      });
    } else {
      // Fallback to browser confirm if showConfirmation is not available
      if (
        confirm(
          `Are you sure you want to delete "${subject.name}"? This action cannot be undone.`
        )
      ) {
        setBusy(true);
        setErr(null);
        fetch(`/api/subjects/${subject.id}`, {
          method: 'DELETE',
        })
          .then(async res => {
            if (!res.ok) {
              const j = await res.json().catch(() => ({}));
              throw new Error(j?.error ?? 'Delete failed');
            }

            if (onSubjectDeleted) {
              onSubjectDeleted(subject.id);
            }

            toast.success('Subject deleted successfully');
            router.refresh();
          })
          .catch((e: any) => {
            setErr(e.message);
            toast.error('Failed to delete subject');
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
          <Tooltip content="Press Enter to save or Escape to cancel">
            <input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={busy}
              className="rounded-md border border-input bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter subject name"
            />
          </Tooltip>
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
                  setName(subject.name); // Reset to original name
                }}
                disabled={busy}
                className="rounded-md border border-border bg-background px-3 py-1 text-foreground hover:bg-muted disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <Tooltip content="Click to rename this subject (Enter to save, Escape to cancel)">
                <button
                  onClick={() => setEditing(true)}
                  disabled={busy}
                  className="rounded-md border border-border bg-background px-3 py-1 text-foreground hover:bg-muted disabled:opacity-60 transition-colors"
                >
                  Rename
                </button>
              </Tooltip>
              <Tooltip content="Permanently delete this subject and all its problems">
                <button
                  onClick={handleRemove}
                  disabled={busy}
                  className="rounded-md border border-destructive bg-destructive/10 dark:bg-destructive/20 px-3 py-1 text-destructive dark:text-red-400 hover:bg-destructive/20 dark:hover:bg-destructive/30 disabled:opacity-60 transition-colors"
                >
                  Delete
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
