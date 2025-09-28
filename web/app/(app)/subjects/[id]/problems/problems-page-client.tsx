'use client';

import { useState } from 'react';
import ProblemForm from './problem-form';
import ProblemsTable from './problems-table';

interface ProblemsPageClientProps {
  initialProblems: any[];
  initialTagsByProblem: Map<string, any[]>;
  subjectId: string;
  availableTags: any[];
}

export default function ProblemsPageClient({
  initialProblems,
  initialTagsByProblem,
  subjectId,
  availableTags,
}: ProblemsPageClientProps) {
  const [problems, setProblems] = useState(initialProblems);
  const [tagsByProblem, setTagsByProblem] = useState(initialTagsByProblem);

  // Handle new problem creation
  const handleProblemCreated = (newProblem: any) => {
    // Add the new problem to the initial state
    setProblems(prev => [newProblem, ...prev]);
    setTagsByProblem(prev => {
      const newMap = new Map(prev);
      newMap.set(newProblem.id, newProblem.tags || []);
      return newMap;
    });
  };

  // Handle problem deletion
  const handleProblemDeleted = (problemId: string) => {
    setProblems(prev => prev.filter(p => p.id !== problemId));
    setTagsByProblem(prev => {
      const newMap = new Map(prev);
      newMap.delete(problemId);
      return newMap;
    });
  };

  return (
    <>
      {/* Create form with subject fixed */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 font-medium text-card-foreground">Add a problem</h2>
        {/* Pass subjectId; form will hide the subject selector */}
        <ProblemForm 
          subjectId={subjectId} 
          onProblemCreated={handleProblemCreated}
        />
      </div>

      {/* Problems table with search */}
      <ProblemsTable
        initialProblems={problems}
        initialTagsByProblem={tagsByProblem}
        subjectId={subjectId}
        availableTags={availableTags}
        onProblemDeleted={handleProblemDeleted}
      />
    </>
  );
}
