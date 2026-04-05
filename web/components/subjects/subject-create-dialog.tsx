'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconPicker } from '@/components/ui/icon-picker';
import { ColorPicker } from '@/components/ui/color-picker';
import { Spinner } from '@/components/ui/spinner';
import { SubjectWithMetadata } from '@/lib/types';
import { useSubjectForm } from '@/lib/hooks/useSubjectForm';
import { useContentLimit } from '@/lib/hooks/useContentLimit';
import { ContentLimitIndicator } from '@/components/ui/content-limit-indicator';
import { CONTENT_LIMIT_CONSTANTS } from '@/lib/constants';

interface SubjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSubjects: Array<{ color?: string }>;
  onSuccess: (created: SubjectWithMetadata) => void;
}

export function SubjectCreateDialog({
  open,
  onOpenChange,
  existingSubjects,
  onSuccess,
}: SubjectCreateDialogProps) {
  const t = useTranslations('Subjects');
  const tCommon = useTranslations('Common');
  const { data: limitData, isExhausted } = useContentLimit(
    CONTENT_LIMIT_CONSTANTS.RESOURCE_TYPES.SUBJECTS
  );

  const {
    name,
    color,
    icon,
    busy,
    setName,
    setColor,
    setIcon,
    handleSubmit,
    resetForm,
  } = useSubjectForm({
    existingSubjects,
    onSuccess: subject => {
      onSuccess(subject);
      onOpenChange(false);
    },
    resetOnSuccess: false, // We'll reset manually when dialog closes
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('createNew')}</DialogTitle>
          {limitData && (
            <ContentLimitIndicator
              current={limitData.current}
              limit={limitData.limit}
              label={t('notebooksUsed')}
            />
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('notebookName')}</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('notebookNamePlaceholder')}
              disabled={busy}
              className="mt-2"
              required
              autoFocus
            />
          </div>
          <div>
            <Label>{t('icon')}</Label>
            <div className="mt-2">
              <IconPicker value={icon} onChange={setIcon} disabled={busy} />
            </div>
          </div>
          <div>
            <Label>{t('color')}</Label>
            <div className="mt-2">
              <ColorPicker value={color} onChange={setColor} disabled={busy} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={busy || isExhausted}>
              {busy && <Spinner />}
              {busy
                ? t('creating')
                : isExhausted
                  ? t('notebookLimitReached')
                  : t('createNew')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
