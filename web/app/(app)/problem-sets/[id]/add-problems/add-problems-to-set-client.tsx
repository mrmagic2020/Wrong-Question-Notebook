'use client';

import { useRouter } from 'next/navigation';
import { BackLink } from '@/components/back-link';
import EnhancedProblemsTable from '@/app/(app)/subjects/[id]/problems/enhanced-problems-table';
import { AddProblemsToSetClientProps } from '@/lib/types';

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
        <div>
          <h1 className="text-2xl font-bold">Add Problems to Set</h1>
          <p className="text-muted-foreground">
            Add problems from <strong>{problemSet.subject_name}</strong> to{' '}
            <strong>&quot;{problemSet.name}&quot;</strong>
          </p>
        </div>
        <BackLink onClick={() => router.push(`/problem-sets/${problemSet.id}`)}>
          Back to Problem Set
        </BackLink>
      </div>

      {/* Problems Table - Reuse EnhancedProblemsTable with restrictions */}
      <EnhancedProblemsTable
        initialProblems={problems}
        initialTagsByProblem={tagsByProblem}
        subjectId={problemSet.subject_id}
        availableTags={availableTags}
        onProblemDeleted={null} // Disable deletion
        problemSetProblemIds={problemSetProblemIds} // Pass existing problem IDs
        isAddToSetMode={true} // Flag to indicate this is add-to-set mode
        targetProblemSetId={problemSet.id} // Pass the target problem set ID
      />
    </div>
  );
}
