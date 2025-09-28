'use client';

import { useState } from 'react';
import ProblemRow from './problem-row';
import ProblemForm from './problem-form';
import ProblemSearchFilter from './problem-search-filter';
import { ProblemType } from '@/lib/schemas';

type Tag = { id: string; name: string };

interface SearchFilters {
  searchText: string;
  searchFields: {
    title: boolean;
    content: boolean;
  };
  problemTypes: ProblemType[];
  tagIds: string[];
}

export default function ProblemsTable({
  initialProblems,
  initialTagsByProblem,
  subjectId,
  availableTags,
}: {
  initialProblems: any[];
  initialTagsByProblem: Map<string, any[]>;
  subjectId: string;
  availableTags: Tag[];
}) {
  const [editingProblem, setEditingProblem] = useState<any | null>(null);
  const [problems, setProblems] = useState(initialProblems);
  const [tagsByProblem, setTagsByProblem] = useState(initialTagsByProblem);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('subject_id', subjectId);

      if (filters.searchText.trim()) {
        params.set('search_text', filters.searchText.trim());
        params.set('search_title', filters.searchFields.title.toString());
        params.set('search_content', filters.searchFields.content.toString());
      }

      if (filters.problemTypes.length > 0) {
        params.set('problem_types', filters.problemTypes.join(','));
      }

      if (filters.tagIds.length > 0) {
        params.set('tag_ids', filters.tagIds.join(','));
      }

      const response = await fetch(`/api/problems?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch problems');
      }

      // Update problems and tags
      const newProblems = data.data || [];
      const newTagsByProblem = new Map<string, any[]>();

      newProblems.forEach((problem: any) => {
        newTagsByProblem.set(problem.id, problem.tags || []);
      });

      setProblems(newProblems);
      setTagsByProblem(newTagsByProblem);
    } catch (err: any) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Search and Filter Component */}
      <ProblemSearchFilter
        onSearch={handleSearch}
        availableTags={availableTags}
        subjectId={subjectId}
      />

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error: {error}</p>
        </div>
      )}

      {/* Edit form (when editing) */}
      {editingProblem && (
        <div className="rounded-lg border bg-card p-4 mb-6">
          <ProblemForm
            subjectId={subjectId}
            problem={editingProblem}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Problems table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-4 py-2 text-muted-foreground">Title</th>
              <th className="px-4 py-2 text-muted-foreground">Type</th>
              <th className="px-4 py-2 text-muted-foreground">Tags</th>
              <th className="px-4 py-2 w-44 text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  className="px-4 py-6 text-muted-foreground text-center"
                  colSpan={4}
                >
                  Searching...
                </td>
              </tr>
            ) : problems.length ? (
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
                <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                  No problems found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
