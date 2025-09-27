'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState, useMemo } from 'react';
import FileManager from '@/components/ui/file-manager';

type Tag = { id: string; name: string };

export default function ProblemForm({ subjectId }: { subjectId: string }) {
  const router = useRouter();

  // Load tags client-side for simplicity here
  const [tags, setTags] = useState<Tag[]>([]);
  useEffect(() => {
    fetch(`/api/tags?subject_id=${subjectId}`)
      .then(r => r.json())
      .then(j => setTags(j.data ?? []))
      .catch(() => {});
  }, [subjectId]);

  const [content, setContent] = useState('');
  const [problemType, setProblemType] = useState<
    'mcq' | 'fill' | 'short' | 'extended'
  >('fill');
  const [autoMark, setAutoMark] = useState(true);
  const [status, setStatus] = useState<'wrong' | 'needs_review' | 'mastered'>(
    'needs_review'
  );

  // Correct answer inputs
  const [mcqChoice, setMcqChoice] = useState('A');
  const [fillValue, setFillValue] = useState('');
  const [shortText, setShortText] = useState('');

  // Assets
  const [problemAssets, setProblemAssets] = useState<Array<{path: string; name: string}>>([]);
  const [solutionText, setSolutionText] = useState('');
  const [solutionAssets, setSolutionAssets] = useState<Array<{path: string; name: string}>>([]);

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
      case 'fill':
        return {
          type: 'fill',
          value: isNaN(Number(fillValue)) ? fillValue : Number(fillValue),
        };
      case 'short':
        return { type: 'short', text: shortText };
      case 'extended':
        return { type: 'extended' };
    }
  }, [problemType, mcqChoice, fillValue, shortText]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const assets = problemAssets.map(asset => ({ path: asset.path }));
    const solution_assets = solutionAssets.map(asset => ({ path: asset.path }));

    const payload = {
      subject_id: subjectId,
      content,
      problem_type: problemType,
      correct_answer: problemType === 'extended' ? undefined : correctAnswer,
      auto_mark: autoMark,
      status,
      assets,
      solution_text: solutionText || undefined,
      solution_assets,
      tag_ids: selectedTagIds.length ? selectedTagIds : undefined,
    };

    const res = await fetch('/api/problems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j?.error ?? 'Failed to create problem');
      return;
    }

    // Clean up staging files after successful problem creation
    try {
      await fetch(`/api/uploads/staging?stagingId=${stagingId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('Failed to cleanup staging files after successful submission:', error);
    }

    // Reset some fields
    setContent('');
    setProblemAssets([]);
    setSolutionText('');
    setSolutionAssets([]);
    setFillValue('');
    setShortText('');
    setMcqChoice('A');
    setSelectedTagIds([]);
    setProblemType('fill');
    setAutoMark(true);
    setStatus('needs_review');

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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* content */}
      <div className="flex items-start gap-3">
        <label className="w-32 text-sm text-gray-600 pt-2">Content</label>
        <textarea
          className="flex-1 rounded-md border px-3 py-2 h-28"
          placeholder="Type the problem text (Markdown/LaTeX supported)"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
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
            onChange={e => setProblemType(e.target.value as any)}
          >
            <option value="mcq">Multiple Choice</option>
            <option value="fill">Fill the Gap</option>
            <option value="short">Short Answer</option>
            <option value="extended">Extended Response</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoMark}
            onChange={e => setAutoMark(e.target.checked)}
          />
          Auto-mark during revision
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
          <select
            className="w-32 rounded-md border px-2 py-1"
            value={mcqChoice}
            onChange={e => setMcqChoice(e.target.value)}
          >
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>D</option>
            <option>E</option>
          </select>
        </div>
      )}
      {problemType === 'fill' && (
        <div className="flex items-center gap-3">
          <label className="w-32 text-sm text-gray-600">Correct value</label>
          <input
            className="w-64 rounded-md border px-3 py-2"
            placeholder="e.g. 42 or some text"
            value={fillValue}
            onChange={e => setFillValue(e.target.value)}
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

      <div>
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Add problem
        </button>
      </div>
    </form>
  );
}
