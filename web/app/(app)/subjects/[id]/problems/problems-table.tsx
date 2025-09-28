'use client';

import { useState, useEffect } from 'react';
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
  onProblemDeleted = null,
  onProblemUpdated = null,
}: {
  initialProblems: any[];
  initialTagsByProblem: Map<string, any[]>;
  subjectId: string;
  availableTags: Tag[];
  onProblemDeleted?: ((problemId: string) => void) | null;
  onProblemUpdated?: ((updatedProblem: any) => void) | null;
}) {
  const [editingProblem, setEditingProblem] = useState<any | null>(null);
  const [problems, setProblems] = useState(initialProblems);
  const [tagsByProblem, setTagsByProblem] = useState(initialTagsByProblem);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(null);

  // Track if we're in a filtered state
  const [isFiltered, setIsFiltered] = useState(false);

  // Only update from props when not in a filtered state
  useEffect(() => {
    if (!isFiltered) {
      setProblems(initialProblems);
    }
  }, [initialProblems, isFiltered]);

  useEffect(() => {
    if (!isFiltered) {
      setTagsByProblem(initialTagsByProblem);
    }
  }, [initialTagsByProblem, isFiltered]);

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
    setCurrentFilters(filters); // Store current filters
    
    // Check if we have any active filters
    const hasActiveFilters = 
      filters.searchText.trim() !== '' ||
      filters.problemTypes.length > 0 ||
      filters.tagIds.length > 0 ||
      !filters.searchFields.title ||
      !filters.searchFields.content;
    
    setIsFiltered(hasActiveFilters);
    
    // If no active filters, reset to show all problems from initial state
    if (!hasActiveFilters) {
      setProblems(initialProblems);
      setTagsByProblem(initialTagsByProblem);
      setLoading(false);
      return;
    }
    
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

  // Function to check if a problem matches current filters
  const problemMatchesFilters = (problem: any, filters: SearchFilters): boolean => {
    // Check text search
    if (filters.searchText.trim()) {
      const searchTerm = filters.searchText.toLowerCase();
      let textMatch = false;
      
      if (filters.searchFields.title && problem.title?.toLowerCase().includes(searchTerm)) {
        textMatch = true;
      }
      if (filters.searchFields.content) {
        if (problem.content?.toLowerCase().includes(searchTerm) || 
            problem.solution_text?.toLowerCase().includes(searchTerm)) {
          textMatch = true;
        }
      }
      
      if (!textMatch) return false;
    }
    
    // Check problem type filter
    if (filters.problemTypes.length > 0 && !filters.problemTypes.includes(problem.problem_type)) {
      return false;
    }
    
    // Check tag filter
    if (filters.tagIds.length > 0) {
      const problemTagIds = problem.tags?.map((tag: any) => tag.id) || [];
      if (!filters.tagIds.some(tagId => problemTagIds.includes(tagId))) {
        return false;
      }
    }
    
    return true;
  };

  // Handle new problem creation
  const handleProblemCreated = (newProblem: any) => {
    // Always add the problem if we're not in a filtered state
    // Only check filters if we're actively filtering
    const shouldAdd = !isFiltered || (currentFilters && problemMatchesFilters(newProblem, currentFilters));
    
    if (shouldAdd) {
      setProblems(prev => [newProblem, ...prev]);
      setTagsByProblem(prev => {
        const newMap = new Map(prev);
        newMap.set(newProblem.id, newProblem.tags || []);
        return newMap;
      });
    }
  };

  // Handle problem deletion
  const handleProblemDeleted = (problemId: string) => {
    setProblems(prev => prev.filter(p => p.id !== problemId));
    setTagsByProblem(prev => {
      const newMap = new Map(prev);
      newMap.delete(problemId);
      return newMap;
    });
    
    // Notify parent component
    if (onProblemDeleted) {
      onProblemDeleted(problemId);
    }
  };

  // Handle problem update
  const handleProblemUpdated = (updatedProblem: any) => {
    // Check if we're in a filtered state and if the updated problem matches current filters
    const shouldShowUpdated = !isFiltered || (currentFilters && problemMatchesFilters(updatedProblem, currentFilters));
    
    if (shouldShowUpdated) {
      // Update the problem in the list
      setProblems(prev => 
        prev.map(p => p.id === updatedProblem.id ? updatedProblem : p)
      );
    } else {
      // If the updated problem no longer matches filters, remove it from the list
      setProblems(prev => prev.filter(p => p.id !== updatedProblem.id));
    }
    
    // Always update the tags mapping for consistency
    setTagsByProblem(prev => {
      const newMap = new Map(prev);
      newMap.set(updatedProblem.id, updatedProblem.tags || []);
      return newMap;
    });
    
    // Notify parent component
    if (onProblemUpdated) {
      onProblemUpdated(updatedProblem);
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
            onProblemCreated={handleProblemCreated}
            onProblemUpdated={handleProblemUpdated}
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
                  onDelete={handleProblemDeleted}
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
