'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

function TagCapsules({ tags }: { tags: { id: string; name: string }[] }) {
  // Show up to 4 tags, then "+N" more
  const maxShown = 4;
  const shown = tags.slice(0, maxShown);
  const extra = tags.length - shown.length;

  return (
    <div className="flex flex-wrap gap-2 max-w-[24rem]">
      {shown.map(t => (
        <span
          key={t.id}
          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-gray-50"
          title={t.name}
        >
          {t.name.length > 18 ? t.name.slice(0, 18) + '…' : t.name}
        </span>
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-gray-100">
          +{extra} more
        </span>
      )}
    </div>
  );
}

export default function ProblemRow({
  problem,
  tags,
}: {
  problem: any;
  tags: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(
    problem.status as 'wrong' | 'needs_review' | 'mastered'
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function updateStatus(next: 'wrong' | 'needs_review' | 'mastered') {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/problems/${problem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? 'Update failed');
      setStatus(next);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this problem?')) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/problems/${problem.id}`, {
        method: 'DELETE',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? 'Delete failed');
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-t align-top">
      <td className="px-4 py-2 max-w-[32rem]">
        <div className="truncate" title={problem.title}>
          {problem.title}
        </div>
        {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
      </td>
      <td className="px-4 py-2">{problem.problem_type}</td>
      <td className="px-4 py-2">
        {tags.length ? (
          <TagCapsules tags={tags} />
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-2">
        <select
          className="rounded-md border px-2 py-1"
          value={status}
          onChange={e => updateStatus(e.target.value as any)}
          disabled={busy}
        >
          <option value="needs_review">needs_review</option>
          <option value="wrong">wrong</option>
          <option value="mastered">mastered</option>
        </select>
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={remove}
            disabled={busy}
            className="rounded-md border px-3 py-1 text-red-600 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
