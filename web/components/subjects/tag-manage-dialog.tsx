'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { apiUrl } from '@/lib/api-utils';
import { Tag } from '@/lib/types';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useContentLimit } from '@/lib/hooks/useContentLimit';
import { ContentLimitIndicator } from '@/components/ui/content-limit-indicator';
import { CONTENT_LIMIT_CONSTANTS } from '@/lib/constants';

interface TagManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName: string;
}

export function TagManageDialog({
  open,
  onOpenChange,
  subjectId,
  subjectName,
}: TagManageDialogProps) {
  const t = useTranslations('Subjects');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busyTagId, setBusyTagId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );
  const editInputRef = useRef<HTMLInputElement>(null);
  const {
    data: limitData,
    isExhausted: tagLimitExhausted,
    refresh: refreshLimit,
  } = useContentLimit(
    CONTENT_LIMIT_CONSTANTS.RESOURCE_TYPES.TAGS_PER_SUBJECT,
    subjectId
  );

  // Fetch tags when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/tags?subject_id=${subjectId}`)
      .then(r => r.json())
      .then(j => setTags(j.data ?? []))
      .catch(() => toast.error(t('failedToLoadTags')))
      .finally(() => setLoading(false));
  }, [open, subjectId, t]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingTagId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTagId]);

  const isDuplicate = (name: string, excludeId?: string) =>
    tags.some(
      t =>
        t.name.toLowerCase() === name.trim().toLowerCase() && t.id !== excludeId
    );

  async function handleCreateTag() {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    if (isDuplicate(trimmed)) {
      toast.error(t('tagExists'));
      return;
    }

    setCreatingTag(true);
    try {
      const res = await fetch(apiUrl('/api/tags'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subjectId, name: trimmed }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? t('failedToCreateTag'));

      setTags(prev => [...prev, j.data]);
      setNewTagName('');
      toast.success(t('tagCreated'));
      refreshLimit();
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || t('failedToCreateTag'));
    } finally {
      setCreatingTag(false);
    }
  }

  async function handleRenameTag(tagId: string) {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error(t('tagNameEmpty'));
      return;
    }
    if (isDuplicate(trimmed, tagId)) {
      toast.error(t('tagExists'));
      return;
    }

    setBusyTagId(tagId);
    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? t('failedToRenameTag'));

      setTags(prev =>
        prev.map(t => (t.id === tagId ? { ...t, name: trimmed } : t))
      );
      setEditingTagId(null);
      toast.success(t('tagRenamed'));
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || t('failedToRenameTag'));
    } finally {
      setBusyTagId(null);
    }
  }

  async function confirmDeleteTag(tagId: string) {
    setBusyTagId(tagId);
    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? t('failedToDeleteTag'));

      setTags(prev => prev.filter(t => t.id !== tagId));
      setConfirmingDeleteId(null);
      toast.success(t('tagDeleted'));
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || t('failedToDeleteTag'));
    } finally {
      setBusyTagId(null);
    }
  }

  const handleEditKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    tagId: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameTag(tagId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingTagId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {subjectName} — {t('tags')}
            </DialogTitle>
          </DialogHeader>

          {/* Create tag */}
          {limitData && (
            <ContentLimitIndicator
              current={limitData.current}
              limit={limitData.limit}
              label={t('tagsUsed')}
            />
          )}
          <div className="flex items-center gap-2">
            <Input
              placeholder={
                tagLimitExhausted ? t('tagLimitReached') : t('newTagName')
              }
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateTag();
                }
              }}
              disabled={creatingTag || tagLimitExhausted}
              className="flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCreateTag}
              disabled={creatingTag || !newTagName.trim() || tagLimitExhausted}
            >
              {creatingTag && <Spinner />}
              {tCommon('add')}
            </Button>
          </div>

          {/* Tag list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-5 w-5" />
            </div>
          ) : tags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('noTagsYet')}
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto -mx-1 px-1 space-y-1">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 group"
                >
                  {editingTagId === tag.id ? (
                    <>
                      <Input
                        ref={editInputRef}
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => handleEditKeyDown(e, tag.id)}
                        disabled={busyTagId === tag.id}
                        className="h-8 flex-1 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRenameTag(tag.id)}
                        disabled={busyTagId === tag.id}
                      >
                        {busyTagId === tag.id ? (
                          <Spinner />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingTagId(null)}
                        disabled={busyTagId === tag.id}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : confirmingDeleteId === tag.id ? (
                    <>
                      <span className="flex-1 text-sm truncate">
                        {tag.name}
                      </span>
                      <span className="text-xs text-destructive whitespace-nowrap">
                        {t('deleteTag')}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => confirmDeleteTag(tag.id)}
                        disabled={busyTagId === tag.id}
                      >
                        {busyTagId === tag.id ? (
                          <Spinner />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setConfirmingDeleteId(null)}
                        disabled={busyTagId === tag.id}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm truncate">
                        {tag.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setEditingTagId(tag.id);
                          setEditingName(tag.name);
                        }}
                        disabled={busyTagId === tag.id}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => setConfirmingDeleteId(tag.id)}
                        disabled={busyTagId === tag.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
