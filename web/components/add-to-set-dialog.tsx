'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface ProblemSet {
  id: string;
  name: string;
  subject_id: string;
}

interface AddToSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemId: string;
  subjectId: string;
  onSuccess?: () => void;
}

export default function AddToSetDialog({
  open,
  onOpenChange,
  problemId,
  subjectId,
  onSuccess,
}: AddToSetDialogProps) {
  const t = useTranslations('ProblemSets');
  const tCommon = useTranslations('Common');
  const [isLoading, setIsLoading] = useState(false);
  const [problemSets, setProblemSets] = useState<ProblemSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [problemSetProblems, setProblemSetProblems] = useState<
    Record<string, string[]>
  >({});

  const loadProblemSets = useCallback(async () => {
    try {
      const response = await fetch(`/api/problem-sets?subject_id=${subjectId}`);
      if (response.ok) {
        const data = await response.json();
        const sets = data.data || [];
        setProblemSets(sets);

        // Load problems for each set
        const problemsMap: Record<string, string[]> = {};
        for (const set of sets) {
          const problems = await loadProblemSetProblems(set.id);
          problemsMap[set.id] = problems;
        }
        setProblemSetProblems(problemsMap);
      }
    } catch (error) {
      console.error('Error loading problem sets:', error);
    }
  }, [subjectId]);

  // Load problem sets for this subject
  useEffect(() => {
    if (open && subjectId) {
      loadProblemSets();
    }
  }, [open, subjectId, loadProblemSets]);

  const loadProblemSetProblems = async (problemSetId: string) => {
    try {
      const response = await fetch(
        `/api/problem-sets/${problemSetId}/problems`
      );
      if (response.ok) {
        const data = await response.json();
        return data.data?.map((p: any) => p.problem_id) || [];
      }
    } catch (error) {
      console.error('Error loading problem set problems:', error);
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSetId) {
      toast.error(t('pleaseSelectProblemSet'));
      return;
    }

    if (!problemId) {
      toast.error(t('invalidProblem'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/problem-sets/${selectedSetId}/problems`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ problem_ids: [problemId] }),
        }
      );

      if (!response.ok) {
        let errorMessage = t('failedToAddProblemToSet');
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          // If response is not JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success(t('problemAddedToSetSuccessfully'));
      onOpenChange(false);
      setSelectedSetId('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding problem to set:', error);
      toast.error(
        error instanceof Error ? error.message : t('failedToAddProblemToSet')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('addToProblemSet')}</DialogTitle>
          <DialogDescription>{t('selectProblemSet')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('problemSet')}</label>
            <Select value={selectedSetId} onValueChange={setSelectedSetId}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectProblemSet')} />
              </SelectTrigger>
              <SelectContent>
                {problemSets
                  .filter(
                    set => !problemSetProblems[set.id]?.includes(problemId)
                  )
                  .map(set => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {problemSets.filter(
            set => !problemSetProblems[set.id]?.includes(problemId)
          ).length === 0 && (
            <p className="text-sm text-muted-foreground">
              {problemSets.length === 0
                ? t('noProblemSetsForSubject')
                : t('problemAlreadyInAllSets')}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !selectedSetId ||
                problemSets.filter(
                  set => !problemSetProblems[set.id]?.includes(problemId)
                ).length === 0
              }
            >
              {isLoading ? t('adding') : t('addToSet')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
