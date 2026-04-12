'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PROBLEM_SET_CONSTANTS } from '@/lib/constants';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemSetId: string;
}

export function ReportDialog({
  open,
  onOpenChange,
  problemSetId,
}: ReportDialogProps) {
  const t = useTranslations('ReportDialog');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/problem-sets/${problemSetId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details: details || undefined }),
      });

      if (res.ok) {
        toast.success(t('success'));
        onOpenChange(false);
        setReason('');
        setDetails('');
      } else if (res.status === 409) {
        toast.info(t('alreadyReported'));
        onOpenChange(false);
      } else {
        toast.error(t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>{t('reasonLabel')}</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {PROBLEM_SET_CONSTANTS.REPORT_REASONS.map(r => {
                const itemId = `report-reason-${r}`;
                return (
                  <div key={r} className="flex items-center space-x-2">
                    <RadioGroupItem value={r} id={itemId} />
                    <Label
                      htmlFor={itemId}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {t(`reasons.${r}` as any)}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details">{t('detailsLabel')}</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder={t('detailsPlaceholder')}
              maxLength={1000}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            variant="destructive"
          >
            {submitting ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
