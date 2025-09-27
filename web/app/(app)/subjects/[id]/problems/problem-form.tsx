'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState, useMemo } from 'react';
import FileManager from '@/components/ui/file-manager';
import { PROBLEM_TYPE_VALUES, type ProblemType } from '@/lib/schemas';

type Tag = { id: string; name: string };

// Helper function to get display names for problem types
const getProblemTypeDisplayName = (type: ProblemType): string => {
  switch (type) {
    case 'mcq':
      return 'Multiple Choice';
    case 'short':
      return 'Short Answer';
    case 'extended':
      return 'Extended Response';
    default:
      return type;
  }
};

export default function ProblemForm({ 
  subjectId, 
  problem = null, 
  onCancel = null 
}: { 
  subjectId: string; 
  problem?: any | null; 
  onCancel?: (() => void) | null; 
}) {
  const router = useRouter();
  const isEditMode = !!problem;

  // Load tags client-side for simplicity here
  const [tags, setTags] = useState<Tag[]>([]);
  useEffect(() => {
    fetch(`/api/tags?subject_id=${subjectId}`)
      .then(r => r.json())
      .then(j => setTags(j.data ?? []))
      .catch(() => {});
  }, [subjectId]);

  // Load problem's existing tags when in edit mode
  useEffect(() => {
    if (problem && tags.length > 0) {
      // Get the tags that belong to this problem
      fetch(`/api/problems/${problem.id}`)
        .then(r => r.json())
        .then(j => {
          if (j.data && j.data.tags) {
            const tagIds = j.data.tags.map((tag: any) => tag.id);
            setSelectedTagIds(tagIds);
          }
        })
        .catch(() => {});
    }
  }, [problem, tags.length]);

  // Form expansion state (only for create mode)
  const [isExpanded, setIsExpanded] = useState(isEditMode);

  const [title, setTitle] = useState(problem?.title || '');
  const [content, setContent] = useState(problem?.content || '');
  const [problemType, setProblemType] = useState<ProblemType>(problem?.problem_type || 'short');
  const [status, setStatus] = useState<'wrong' | 'needs_review' | 'mastered'>(
    problem?.status || 'needs_review'
  );
  const [autoMark, setAutoMark] = useState(problem?.auto_mark || false);

  // Auto-update auto-mark based on problem type
  useEffect(() => {
    switch (problemType) {
      case 'mcq':
        setAutoMark(true);
        break;
      case 'short':
        setAutoMark(false);
        break;
      case 'extended':
        setAutoMark(false);
        break;
    }
  }, [problemType]);

  // Auto-mark behavior based on problem type
  const autoMarkValue = useMemo(() => {
    switch (problemType) {
      case 'mcq':
        return autoMark;
      case 'short':
        return autoMark;
      case 'extended':
        return false; // Always false for extended response
      default:
        return false;
    }
  }, [problemType, autoMark]);

  const isAutoMarkDisabled = problemType === 'extended';

  // Correct answer inputs
  const [mcqChoice, setMcqChoice] = useState(
    problem?.correct_answer?.type === 'mcq' ? problem.correct_answer.choice : ''
  );
  const [shortText, setShortText] = useState(
    problem?.correct_answer?.type === 'short' ? problem.correct_answer.text : ''
  );

  // Assets
  const [problemAssets, setProblemAssets] = useState<Array<{path: string; name: string}>>(
    problem?.assets?.map((asset: any) => ({ path: asset.path, name: asset.path.split('/').pop() || '' })) || []
  );
  const [solutionText, setSolutionText] = useState(problem?.solution_text || '');
  const [solutionAssets, setSolutionAssets] = useState<Array<{path: string; name: string}>>(
    problem?.solution_assets?.map((asset: any) => ({ path: asset.path, name: asset.path.split('/').pop() || '' })) || []
  );

  // Tag picker
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  function toggleTag(id: string) {
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  const correctAnswer = useMemo(() => {
    switch (problemType) {
      case 'mcq':
        return { type: 'mcq', choice: mcqChoice };
      case 'short':
        return { type: 'short', text: shortText };
      case 'extended':
        return { type: 'extended' };
    }
  }, [problemType, mcqChoice, shortText]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const assets = problemAssets.map(asset => ({ path: asset.path }));
    const solution_assets = solutionAssets.map(asset => ({ path: asset.path }));

    const payload = {
      title,
      content: content || undefined,
      problem_type: problemType,
      correct_answer: problemType === 'extended' ? undefined : correctAnswer,
      auto_mark: autoMarkValue,
      status,
      assets,
      solution_text: solutionText || undefined,
      solution_assets,
      tag_ids: selectedTagIds.length ? selectedTagIds : undefined,
    };

    // Add subject_id for create operations
    if (!isEditMode) {
      (payload as any).subject_id = subjectId;
    }

    const url = isEditMode ? `/api/problems/${problem.id}` : '/api/problems';
    const method = isEditMode ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j?.error ?? `Failed to ${isEditMode ? 'update' : 'create'} problem`);
      return;
    }

    // Clean up staging files after successful problem creation/update
    try {
      await fetch(`/api/uploads/staging?stagingId=${stagingId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('Failed to cleanup staging files after successful submission:', error);
    }

    if (isEditMode) {
      // In edit mode, call onCancel to close the form
      if (onCancel) {
        onCancel();
      }
    } else {
      // Reset some fields for create mode
      setTitle('');
      setContent('');
      setProblemAssets([]);
      setSolutionText('');
      setSolutionAssets([]);
      setShortText('');
      setMcqChoice('');
      setSelectedTagIds([]);
      setProblemType('short');
      setStatus('needs_review');
      setAutoMark(false);
      setIsExpanded(false);
    }

    router.refresh();
  }

  const [stagingId] = useState(
    () => `${Date.now()}-${globalThis.crypto?.randomUUID?.() ?? 'rnd'}`
  );

  // Clean up staging folder when component unmounts or user leaves page
  useEffect(() => {
    const cleanupStaging = async () => {
      try {
        // Use sendBeacon for more reliable cleanup on page unload
        if (navigator.sendBeacon) {
          const formData = new FormData();
          formData.append('stagingId', stagingId);
          navigator.sendBeacon('/api/uploads/staging', formData);
        } else {
          // Fallback to fetch with keepalive
          await fetch(`/api/uploads/staging?stagingId=${stagingId}`, {
            method: 'DELETE',
            keepalive: true,
          });
        }
      } catch (error) {
        console.warn('Failed to cleanup staging files:', error);
      }
    };

    // Cleanup on page unload/refresh/close (when user truly leaves)
    const handleBeforeUnload = () => {
      cleanupStaging();
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Return cleanup function for component unmount (navigation within app)
    return () => {
      cleanupStaging();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [stagingId]);

  // If not expanded (create mode only), show just the expand button
  if (!isExpanded && !isEditMode) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex-1 rounded-md border border-dashed border-gray-300 px-4 py-3 text-left text-gray-600 hover:border-gray-400 hover:text-gray-800"
        >
          + Add a new problem
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isEditMode && (
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-medium text-gray-900">Edit Problem</h3>
          <button
            type="button"
            onClick={() => onCancel?.()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
      
      {/* title */}
      <div className="flex items-center gap-3">
        <label className="w-32 text-sm text-gray-600">Title</label>
        <input
          type="text"
          className="flex-1 rounded-md border px-3 py-2"
          placeholder="Short descriptive title for the problem"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={200}
          required
        />
      </div>

      {/* content */}
      <div className="flex items-start gap-3">
        <label className="w-32 text-sm text-gray-600 pt-2">Content</label>
        <textarea
          className="flex-1 rounded-md border px-3 py-2 h-28"
          placeholder="Type the problem text (Markdown/LaTeX supported) - Optional"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>

      {/* problem assets */}
      <div className="flex items-start gap-3">
        <label className="w-32 text-sm text-gray-600 pt-2">
          Problem assets
        </label>
        <div className="flex-1">
          <FileManager
            role="problem"
            stagingId={stagingId}
            initialFiles={problemAssets}
            onFilesChange={setProblemAssets}
          />
        </div>
      </div>

      {/* type + auto-mark + status */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Type</label>
          <select
            className="rounded-md border px-2 py-1"
            value={problemType}
            onChange={e => setProblemType(e.target.value as ProblemType)}
          >
            {PROBLEM_TYPE_VALUES.map(type => (
              <option key={type} value={type}>
                {getProblemTypeDisplayName(type)}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoMarkValue}
            disabled={isAutoMarkDisabled}
            onChange={e => setAutoMark(e.target.checked)}
          />
          Auto-mark during revision
          {isAutoMarkDisabled && (
            <span className="text-xs text-gray-500">(not available for extended response)</span>
          )}
        </label>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Status</label>
          <select
            className="rounded-md border px-2 py-1"
            value={status}
            onChange={e => setStatus(e.target.value as any)}
          >
            <option value="needs_review">Needs review</option>
            <option value="wrong">Wrong</option>
            <option value="mastered">Mastered</option>
          </select>
        </div>
      </div>

      {/* correct answer (conditional) */}
      {problemType === 'mcq' && (
        <div className="flex items-center gap-3">
          <label className="w-32 text-sm text-gray-600">Correct choice</label>
          <input
            className="w-32 rounded-md border px-3 py-2"
            placeholder="e.g. A, B, α, etc."
            value={mcqChoice}
            onChange={e => setMcqChoice(e.target.value)}
          />
        </div>
      )}
      {problemType === 'short' && (
        <div className="flex items-center gap-3">
          <label className="w-32 text-sm text-gray-600">Correct text</label>
          <input
            className="flex-1 rounded-md border px-3 py-2"
            placeholder="Short expected answer"
            value={shortText}
            onChange={e => setShortText(e.target.value)}
          />
        </div>
      )}

      {/* solution text + assets */}
      <div className="flex items-start gap-3">
        <label className="w-32 text-sm text-gray-600 pt-2">
          Solution (text)
        </label>
        <textarea
          className="flex-1 rounded-md border px-3 py-2 h-24"
          placeholder="Optional: typed solution (Markdown/LaTeX)"
          value={solutionText}
          onChange={e => setSolutionText(e.target.value)}
        />
      </div>
      <div className="flex items-start gap-3">
        <label className="w-32 text-sm text-gray-600 pt-2">
          Solution assets
        </label>
        <div className="flex-1">
          <FileManager
            role="solution"
            stagingId={stagingId}
            initialFiles={solutionAssets}
            onFilesChange={setSolutionAssets}
          />
        </div>
      </div>

      {/* tag picker */}
      <div className="flex items-start gap-3">
        <label className="w-32 text-sm text-gray-600 pt-1">Tags</label>
        <div className="flex flex-wrap gap-3">
          {tags.length ? (
            tags.map(t => (
              <label key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(t.id)}
                  onChange={() => toggleTag(t.id)}
                />
                <span>{t.name}</span>
              </label>
            ))
          ) : (
            <div className="text-gray-500">No tags yet.</div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          {isEditMode ? 'Update problem' : 'Add problem'}
        </button>
        {!isEditMode && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="rounded-md border px-4 py-2 text-gray-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
