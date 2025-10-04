'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import EnhancedProblemsTable from '@/app/(app)/subjects/[id]/problems/enhanced-problems-table';

interface ProblemSet {
  id: string;
  name: string;
  description: string | null;
  subject_id: string;
  subject_name: string;
}

interface AddProblemsToSetClientProps {
  problemSet: ProblemSet;
  problems: any[];
  tagsByProblem: Map<string, any[]>;
  availableTags: any[];
  problemSetProblemIds: string[];
}

export default function AddProblemsToSetClient({
  problemSet,
  problems,
  tagsByProblem,
  availableTags,
  problemSetProblemIds,
}: AddProblemsToSetClientProps) {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/problem-sets/${problemSet.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Problem Set
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add Problems to Set</h1>
            <p className="text-muted-foreground">
              Add problems from <strong>{problemSet.subject_name}</strong> to{' '}
              <strong>"{problemSet.name}"</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Problems Table - Reuse EnhancedProblemsTable with restrictions */}
      <EnhancedProblemsTable
        initialProblems={problems}
        initialTagsByProblem={tagsByProblem}
        subjectId={problemSet.subject_id}
        availableTags={availableTags}
        onProblemDeleted={null} // Disable deletion
        onProblemUpdated={null} // Disable editing
        problemSetProblemIds={problemSetProblemIds} // Pass existing problem IDs
        isAddToSetMode={true} // Flag to indicate this is add-to-set mode
        targetProblemSetId={problemSet.id} // Pass the target problem set ID
      />
    </div>
  );
}
