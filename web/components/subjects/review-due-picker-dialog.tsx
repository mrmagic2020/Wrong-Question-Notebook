'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPACED_REPETITION_CONSTANTS } from '@/lib/constants';
import { toast } from 'sonner';

interface ReviewDuePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName: string;
  dueCount: number;
}

export function ReviewDuePickerDialog({
  open,
  onOpenChange,
  subjectId,
  subjectName,
  dueCount,
}: ReviewDuePickerDialogProps) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);

  const presets = SPACED_REPETITION_CONSTANTS.SESSION_PRESETS.filter(
    p => p <= dueCount
  );

  const handleStart = async () => {
    const size = selectedSize ?? dueCount;
    setStarting(true);
    try {
      const res = await fetch('/api/review-sessions/start-spaced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          session_size: size,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start session');
      }
      const data = await res.json();
      const sessionId = data.data.sessionId;
      onOpenChange(false);
      router.push(`/subjects/${subjectId}/review-due?sessionId=${sessionId}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to start review session');
      setStarting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Spaced Review
          </DialogTitle>
          <DialogDescription>
            {subjectName} &middot; {dueCount}{' '}
            {dueCount === 1 ? 'problem' : 'problems'} due
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            How many problems would you like to review?
          </p>

          <div className="flex flex-wrap gap-2">
            {presets.map(size => (
              <Button
                key={size}
                variant="outline"
                size="sm"
                onClick={() => setSelectedSize(size)}
                className={cn(
                  'rounded-xl',
                  selectedSize === size &&
                    'bg-amber-600 text-white border-amber-600 hover:bg-amber-700 hover:text-white dark:bg-amber-700 dark:border-amber-700'
                )}
              >
                {size}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSize(null)}
              className={cn(
                'rounded-xl',
                selectedSize === null &&
                  'bg-amber-600 text-white border-amber-600 hover:bg-amber-700 hover:text-white dark:bg-amber-700 dark:border-amber-700'
              )}
            >
              All ({dueCount})
            </Button>
          </div>

          <Button
            onClick={handleStart}
            disabled={starting}
            className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white rounded-xl"
          >
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>Start Review ({selectedSize ?? dueCount})</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
