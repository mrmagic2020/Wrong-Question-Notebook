'use client';

import { useState } from 'react';
import ProblemRow from './problem-row';
import ProblemForm from './problem-form';

export default function ProblemsTable({
  problems,
  tagsByProblem,
  subjectId,
}: {
  problems: any[];
  tagsByProblem: Map<string, any[]>;
  subjectId: string;
}) {
  const [editingProblem, setEditingProblem] = useState<any | null>(null);

  const handleEdit = async (problem: any) => {
    // Fetch the full problem data with tags
    try {
      const response = await fetch(`/api/problems/${problem.id}`);
      const data = await response.json();
      if (data.data) {
        setEditingProblem(data.data);
      } else {
        setEditingProblem(problem); // fallback to original data
      }
    } catch (error) {
      console.error('Failed to fetch problem details:', error);
      setEditingProblem(problem); // fallback to original data
    }
  };

  const handleCancelEdit = () => {
    setEditingProblem(null);
  };

  return (
    <>
      {/* Edit form (when editing) */}
      {editingProblem && (
        <div className="rounded-lg border bg-white p-4 mb-6">
          <ProblemForm
            subjectId={subjectId}
            problem={editingProblem}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Problems table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Tags</th>
              <th className="px-4 py-2 w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.length ? (
              problems.map((p: any) => (
                <ProblemRow
                  key={p.id}
                  problem={p}
                  tags={tagsByProblem.get(p.id) ?? []}
                  onEdit={handleEdit}
                />
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={4}>
                  No problems yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
