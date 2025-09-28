'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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
          className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          title={t.name}
        >
          {t.name.length > 18 ? t.name.slice(0, 18) + '…' : t.name}
        </span>
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          +{extra} more
        </span>
      )}
    </div>
  );
}

export default function ProblemRow({
  problem,
  tags,
  onEdit,
  onDelete,
}: {
  problem: any;
  tags: { id: string; name: string }[];
  onEdit?: (problem: any) => void;
  onDelete?: (problemId: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleRemove = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${problem.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/problems/${problem.id}`, {
        method: 'DELETE',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error ?? 'Delete failed');

      // Notify parent component about deletion
      if (onDelete) {
        onDelete(problem.id);
      }

      toast.success('Problem deleted successfully');
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
      toast.error('Failed to delete problem');
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="border-t border-border align-top">
      <td className="px-4 py-2 max-w-[32rem]">
        <div className="truncate text-foreground" title={problem.title}>
          {problem.title}
        </div>
        {err && <div className="mt-1 text-xs text-destructive">{err}</div>}
      </td>
      <td className="px-4 py-2 text-foreground">{problem.problem_type}</td>
      <td className="px-4 py-2">
        {tags.length ? (
          <TagCapsules tags={tags} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={() =>
              router.push(
                `/subjects/${problem.subject_id}/problems/${problem.id}/review`
              )
            }
            disabled={busy}
            className="rounded-md border border-border bg-background px-3 py-1 text-green-600 dark:text-green-400 disabled:opacity-60 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
          >
            Review
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(problem)}
              disabled={busy}
              className="rounded-md border border-border bg-background px-3 py-1 text-blue-600 dark:text-blue-400 disabled:opacity-60 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
            >
              Edit
            </button>
          )}
          <button
            onClick={handleRemove}
            disabled={busy}
            className="rounded-md border border-destructive bg-destructive/10 dark:bg-destructive/20 px-3 py-1 text-destructive dark:text-red-400 hover:bg-destructive/20 dark:hover:bg-destructive/30 disabled:opacity-60 transition-colors"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
