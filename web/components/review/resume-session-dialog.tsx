'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlayCircle, RefreshCw } from 'lucide-react';
import { formatRelativeTime } from '@/lib/common-utils';

interface ResumeSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    id: string;
    started_at: string;
    last_activity_at: string;
    session_state: {
      problem_ids: string[];
      current_index: number;
      completed_problem_ids: string[];
      skipped_problem_ids: string[];
    };
  };
  onResume: (sessionId: string) => void;
  onStartNew: () => void;
  isLoading?: boolean;
}

export default function ResumeSessionDialog({
  open,
  onOpenChange,
  session,
  onResume,
  onStartNew,
  isLoading,
}: ResumeSessionDialogProps) {
  const total = session.session_state.problem_ids.length;
  const completed = session.session_state.completed_problem_ids.length;
  const skipped = session.session_state.skipped_problem_ids.length;
  const remaining = total - completed - skipped;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Resume Session?</DialogTitle>
          <DialogDescription>
            You have an incomplete review session from{' '}
            {formatRelativeTime(session.last_activity_at)}.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold">{completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">{skipped}</div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{remaining}</div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{
                width: `${total > 0 ? ((completed + skipped) / total) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {completed + skipped} / {total} problems attempted
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onStartNew}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Start New Session
          </Button>
          <Button
            onClick={() => onResume(session.id)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Resume Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
