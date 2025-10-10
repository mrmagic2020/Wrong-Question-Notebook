'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { SubjectRowProps } from '@/lib/types';

export default function SubjectRow({
  subject,
  onSubjectDeleted,
  onSubjectUpdated,
  showConfirmation,
}: SubjectRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(subject.name);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

    setRenaming(true);
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
      setRenaming(false);
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
          setDeleting(true);
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
            setDeleting(false);
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
        setDeleting(true);
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
            setDeleting(false);
          });
      }
    }
  };

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2 align-middle">
        {editing ? (
          <Tooltip content="Press Enter to save or Escape to cancel">
            <Input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={renaming}
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
          {editing ? (
            <>
              <Button
                onClick={save}
                disabled={renaming || deleting}
                className="flex items-center gap-1"
              >
                {renaming && <Spinner />}
                {renaming ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={() => {
                  setEditing(false);
                  setName(subject.name); // Reset to original name
                }}
                disabled={renaming || deleting}
                variant="secondary"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" className="">
                <Link href={`/subjects/${subject.id}/problems`}>Problems</Link>
              </Button>
              <Button asChild variant="outline" className="">
                <Link href={`/subjects/${subject.id}/tags`}>Tags</Link>
              </Button>
              <Tooltip content="Click to rename this subject (Enter to save, Escape to cancel)">
                <Button
                  onClick={() => setEditing(true)}
                  disabled={renaming || deleting}
                  variant="outline"
                >
                  Rename
                </Button>
              </Tooltip>
              <Tooltip content="Permanently delete this subject and all its problems">
                <Button
                  onClick={handleRemove}
                  disabled={renaming || deleting}
                  variant="destructive"
                >
                  {deleting && <Spinner />}
                  Delete
                </Button>
              </Tooltip>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
