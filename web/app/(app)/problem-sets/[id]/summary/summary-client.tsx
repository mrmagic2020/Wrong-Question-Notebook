'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  XCircle,
  SkipForward,
  Clock,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { ReviewSessionSummary } from '@/lib/types';
import { formatDisplayDateTime, formatDuration } from '@/lib/common-utils';
import StatusPieChart from '@/components/review/status-pie-chart';

interface SummaryClientProps {
  problemSetId: string;
  sessionId: string;
  problemSetName: string;
  subjectName: string;
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-lg text-muted-foreground">
        <Minus className="h-4 w-4" />0
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-lg font-semibold text-green-600 dark:text-green-400">
        <TrendingUp className="h-4 w-4" />+{delta}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-lg font-semibold text-red-600 dark:text-red-400">
      <TrendingDown className="h-4 w-4" />
      {delta}
    </span>
  );
}

export default function SummaryClient({
  problemSetId,
  sessionId,
  problemSetName,
  subjectName,
}: SummaryClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReviewSessionSummary | null>(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await fetch(`/api/review-sessions/${sessionId}`);
        if (!res.ok) throw new Error('Failed to load session');
        const data = await res.json();
        const session = data.data.session;
        const results = data.data.results || [];
        const problems = data.data.problems || [];

        const completed = results.filter((r: any) => !r.was_skipped);
        const skipped = results.filter((r: any) => r.was_skipped);

        const sessionState = session.session_state;
        const problemIds: string[] = sessionState.problem_ids || [];
        const initialStatuses: Record<string, string> =
          sessionState.initial_statuses || {};

        // Build current statuses from problems data
        const currentStatuses: Record<string, string> = {};
        for (const p of problems) {
          currentStatuses[p.id] = p.status;
        }

        // Count current statuses
        const status_counts = { mastered: 0, needs_review: 0, wrong: 0 };
        for (const pid of problemIds) {
          const status = currentStatuses[pid];
          if (status && status in status_counts) {
            status_counts[status as keyof typeof status_counts]++;
          }
        }

        // Compute deltas
        const status_deltas = { mastered: 0, needs_review: 0, wrong: 0 };
        const initial_counts = { mastered: 0, needs_review: 0, wrong: 0 };
        for (const pid of problemIds) {
          const status = initialStatuses[pid];
          if (status && status in initial_counts) {
            initial_counts[status as keyof typeof initial_counts]++;
          }
        }
        status_deltas.mastered =
          status_counts.mastered - initial_counts.mastered;
        status_deltas.needs_review =
          status_counts.needs_review - initial_counts.needs_review;
        status_deltas.wrong = status_counts.wrong - initial_counts.wrong;

        setSummary({
          total_problems: problemIds.length,
          completed_count: completed.length,
          skipped_count: skipped.length,
          status_counts,
          status_deltas,
          elapsed_ms: sessionState.elapsed_ms || 0,
          started_at: session.started_at,
          completed_at: session.last_activity_at,
        });
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="section-container flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="section-container text-center py-12">
        <p className="text-muted-foreground">Failed to load summary.</p>
        <Button
          className="mt-4"
          onClick={() => router.push(`/problem-sets/${problemSetId}`)}
        >
          Back to Problem Set
        </Button>
      </div>
    );
  }

  const pieData = [
    {
      label: 'Mastered',
      value: summary.status_counts.mastered,
      colorLight: '#34d399', // emerald-400 - vibrant but warm
      colorDark: '#059669', // emerald-600 - rich green for dark mode
    },
    {
      label: 'Needs Review',
      value: summary.status_counts.needs_review,
      colorLight: '#fbbf24', // amber-400 - warm, bright yellow
      colorDark: '#d97706', // amber-600 - rich amber for dark mode
    },
    {
      label: 'Wrong',
      value: summary.status_counts.wrong,
      colorLight: '#fb923c', // orange-400 - warm orange (not harsh red)
      colorDark: '#ea580c', // orange-600 - rich orange for dark mode
    },
  ];

  return (
    <div className="section-container space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          <span className="text-gradient-warm">Review Complete</span>
        </h1>
        <p className="page-description">
          {problemSetName} &middot; {subjectName}
        </p>
      </div>

      {/* Main content: pie chart + status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Pie chart */}
        <Card className="card-section">
          <CardContent className="p-6 flex items-center justify-center h-full">
            <StatusPieChart data={pieData} size={180} />
          </CardContent>
        </Card>

        {/* Right: Status cards */}
        <div className="grid grid-cols-1 gap-3">
          {/* Mastered */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/20 border-green-200/40 dark:border-green-800/30">
            <CardContent className="pt-5 pb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-500/10 dark:bg-green-500/20 p-2.5">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {summary.status_counts.mastered}
                  </div>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80">
                    Mastered
                  </p>
                </div>
              </div>
              <DeltaBadge delta={summary.status_deltas.mastered} />
            </CardContent>
          </Card>

          {/* Needs Review */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/40 dark:to-yellow-900/20 border-yellow-200/40 dark:border-yellow-800/30">
            <CardContent className="pt-5 pb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-yellow-500/10 dark:bg-yellow-500/20 p-2.5">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {summary.status_counts.needs_review}
                  </div>
                  <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80">
                    Needs Review
                  </p>
                </div>
              </div>
              <DeltaBadge delta={summary.status_deltas.needs_review} />
            </CardContent>
          </Card>

          {/* Wrong */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border-red-200/40 dark:border-red-800/30">
            <CardContent className="pt-5 pb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-500/10 dark:bg-red-500/20 p-2.5">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {summary.status_counts.wrong}
                  </div>
                  <p className="text-sm text-red-600/80 dark:text-red-400/80">
                    Wrong
                  </p>
                </div>
              </div>
              <DeltaBadge delta={summary.status_deltas.wrong} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-section">
          <CardContent className="pt-5 pb-5 text-center">
            <div className="text-2xl font-bold">{summary.total_problems}</div>
            <p className="text-xs text-muted-foreground">Total Problems</p>
          </CardContent>
        </Card>

        <Card className="card-section">
          <CardContent className="pt-5 pb-5 text-center">
            <div className="text-2xl font-bold text-primary">
              {summary.completed_count}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card className="card-section">
          <CardContent className="pt-5 pb-5 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {summary.skipped_count}
            </div>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <SkipForward className="h-3 w-3" /> Skipped
            </p>
          </CardContent>
        </Card>

        <Card className="card-section">
          <CardContent className="pt-5 pb-5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
              {formatDuration(summary.elapsed_ms)}
            </div>
            <p className="text-xs text-muted-foreground">Session Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Timestamps */}
      <div className="text-sm text-muted-foreground text-center space-y-1">
        {summary.started_at && (
          <p>Started: {formatDisplayDateTime(summary.started_at)}</p>
        )}
        {summary.completed_at && (
          <p>Completed: {formatDisplayDateTime(summary.completed_at)}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => router.push(`/problem-sets/${problemSetId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Problem Set
        </Button>
      </div>
    </div>
  );
}
