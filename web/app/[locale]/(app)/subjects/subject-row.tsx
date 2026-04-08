'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
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
  const t = useTranslations('CommonUtils');
  const tCommon = useTranslations('Common');
  const tSubjects = useTranslations('Subjects');
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
      setErr(tSubjects('nameCannotBeEmpty'));
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
      toast.success(tSubjects('subjectRenamedSuccessfully'));
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
      toast.error(tSubjects('failedToRenameSubject'));
    } finally {
      setRenaming(false);
    }
  }

  const handleRemove = () => {
    if (showConfirmation) {
      showConfirmation({
        title: tSubjects('deleteSubject'),
        message: tSubjects('confirmDeleteSubject', { name: subject.name }),
        confirmText: t('delete'),
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

            toast.success(tSubjects('subjectDeletedSuccessfully'));
            router.refresh();
          } catch (e: any) {
            setErr(e.message);
            toast.error(tSubjects('failedToDeleteSubject'));
          } finally {
            setDeleting(false);
          }
        },
      });
    } else {
      // Fallback to browser confirm if showConfirmation is not available
      if (
        confirm(
          tSubjects('confirmDeleteSubject', { name: subject.name })
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

            toast.success(tSubjects('subjectDeletedSuccessfully'));
            router.refresh();
          })
          .catch((e: any) => {
            setErr(e.message);
            toast.error(tSubjects('failedToDeleteSubject'));
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
          <Tooltip content={tSubjects('tooltipEnterSaveEscape')}>
            <Input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={renaming}
              placeholder={t('enterSubjectNamePlaceholder')}
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
                {renaming ? tSubjects('saving') : tCommon('save')}
              </Button>
              <Button
                onClick={() => {
                  setEditing(false);
                  setName(subject.name); // Reset to original name
                }}
                disabled={renaming || deleting}
                variant="secondary"
              >
                {tCommon('cancel')}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" className="">
                <Link href={`/subjects/${subject.id}/problems`}>{tSubjects('problems')}</Link>
              </Button>
              <Button asChild variant="outline" className="">
                <Link href={`/subjects/${subject.id}/tags`}>{tSubjects('tags')}</Link>
              </Button>
              <Tooltip content={tSubjects('tooltipClickToRename')}>
                <Button
                  onClick={() => setEditing(true)}
                  disabled={renaming || deleting}
                  variant="outline"
                >
                  {t('rename')}
                </Button>
              </Tooltip>
              <Tooltip content={tSubjects('tooltipPermanentlyDelete')}>
                <Button
                  onClick={handleRemove}
                  disabled={renaming || deleting}
                  variant="destructive"
                >
                  {deleting && <Spinner />}
                  {t('delete')}
                </Button>
              </Tooltip>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
