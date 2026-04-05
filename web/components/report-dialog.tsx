'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PROBLEM_SET_CONSTANTS } from '@/lib/constants';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemSetId: string;
}

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Inappropriate content',
  spam: 'Spam or advertising',
  misleading: 'Misleading or incorrect',
  other: 'Other',
};

export function ReportDialog({
  open,
  onOpenChange,
  problemSetId,
}: ReportDialogProps) {
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
        toast.success(
          'Report submitted. Thank you for helping keep our community safe.'
        );
        onOpenChange(false);
        setReason('');
        setDetails('');
      } else if (res.status === 409) {
        toast.info('You have already reported this problem set.');
        onOpenChange(false);
      } else {
        toast.error('Failed to submit report. Please try again.');
      }
    } catch {
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Problem Set</DialogTitle>
          <DialogDescription>
            Help us keep our community safe. Your report will be reviewed by our
            team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Reason</Label>
            <div className="space-y-2">
              {PROBLEM_SET_CONSTANTS.REPORT_REASONS.map(r => (
                <label
                  key={r}
                  className="flex cursor-pointer items-center space-x-2"
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="h-4 w-4 border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm">{REASON_LABELS[r] || r}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details">
              Additional details (optional)
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Provide any additional context..."
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
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            variant="destructive"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
