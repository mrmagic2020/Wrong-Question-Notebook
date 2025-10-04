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
      toast.error('Please select a problem set');
      return;
    }

    if (!problemId) {
      toast.error('Invalid problem');
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
        let errorMessage = 'Failed to add problem to set';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          // If response is not JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success('Problem added to set successfully');
      onOpenChange(false);
      setSelectedSetId('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding problem to set:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to add problem to set'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add to Problem Set</DialogTitle>
          <DialogDescription>
            Select a problem set to add this problem to.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Problem Set</label>
            <Select value={selectedSetId} onValueChange={setSelectedSetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a problem set" />
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
                ? 'No problem sets found for this subject. Create a problem set first.'
                : 'This problem is already in all available problem sets.'}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
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
              {isLoading ? 'Adding...' : 'Add to Set'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
