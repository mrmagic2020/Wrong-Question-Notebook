'use client';

import { useState } from 'react';
import ProblemForm from './problem-form';
import EnhancedProblemsTable from './enhanced-problems-table';

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

  // Handle problem update
  const handleProblemUpdated = (updatedProblem: any) => {
    setProblems(prev =>
      prev.map(p => (p.id === updatedProblem.id ? updatedProblem : p))
    );
    setTagsByProblem(prev => {
      const newMap = new Map(prev);
      newMap.set(updatedProblem.id, updatedProblem.tags || []);
      return newMap;
    });
  };

  return (
    <>
      {/* Create form with subject fixed */}
      <div className="card-section">
        <div className="card-section-header">
          <h2 className="card-section-title">Add a problem</h2>
        </div>
        {/* Pass subjectId; form will hide the subject selector */}
        <ProblemForm
          subjectId={subjectId}
          availableTags={availableTags}
          onProblemCreated={handleProblemCreated}
        />
      </div>

      {/* Enhanced problems table with search */}
      <EnhancedProblemsTable
        initialProblems={problems}
        initialTagsByProblem={tagsByProblem}
        subjectId={subjectId}
        availableTags={availableTags}
        onProblemDeleted={handleProblemDeleted}
        onProblemUpdated={handleProblemUpdated}
      />
    </>
  );
}
