'use client';

import { useState } from 'react';
import ProblemForm from './problem-form';
import EnhancedProblemsTable from './enhanced-problems-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProblemsPageClientProps {
  initialProblems: any[];
  initialTagsByProblem: Record<string, any[]>;
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
    setTagsByProblem(prev => ({
      ...prev,
      [newProblem.id]: newProblem.tags || [],
    }));
  };

  // Handle problem deletion
  const handleProblemDeleted = (problemId: string) => {
    setProblems(prev => prev.filter(p => p.id !== problemId));
    setTagsByProblem(prev => {
      const newTagsByProblem = { ...prev };
      delete newTagsByProblem[problemId];
      return newTagsByProblem;
    });
  };

  // Handle problem update
  const handleProblemUpdated = (updatedProblem: any) => {
    setProblems(prev =>
      prev.map(p => (p.id === updatedProblem.id ? updatedProblem : p))
    );
    setTagsByProblem(prev => ({
      ...prev,
      [updatedProblem.id]: updatedProblem.tags || [],
    }));
  };

  return (
    <>
      {/* Create form with subject fixed */}
      <Card className="card-section">
        <CardHeader className="card-section-header">
          <CardTitle className="card-section-title">Add a problem</CardTitle>
        </CardHeader>
        {/* Pass subjectId; form will hide the subject selector */}
        <CardContent className="card-section-content">
          <ProblemForm
            subjectId={subjectId}
            availableTags={availableTags}
            onProblemCreated={handleProblemCreated}
          />
        </CardContent>
      </Card>

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
