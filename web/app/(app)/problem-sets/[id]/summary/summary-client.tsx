'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  SkipForward,
  BarChart3,
  Play,
  Loader2,
} from 'lucide-react';
import { ReviewSessionSummary } from '@/lib/types';
import { formatDisplayDateTime } from '@/lib/common-utils';

interface SummaryClientProps {
  problemSetId: string;
  sessionId: string;
  problemSetName: string;
  subjectName: string;
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
        // First try to get the session to check if it's already completed
        const res = await fetch(`/api/review-sessions/${sessionId}`);
        if (!res.ok) throw new Error('Failed to load session');
        const data = await res.json();
        const session = data.data.session;
        const results = data.data.results || [];

        // Calculate summary from existing data
        const completed = results.filter((r: any) => !r.was_skipped);
        const skipped = results.filter((r: any) => r.was_skipped);
        const correct = completed.filter((r: any) => r.was_correct === true);
        const incorrect = completed.filter((r: any) => r.was_correct === false);

        setSummary({
          total_problems: session.session_state.problem_ids.length,
          completed_count: completed.length,
          skipped_count: skipped.length,
          correct_count: correct.length,
          incorrect_count: incorrect.length,
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

  const accuracy =
    summary.completed_count > 0
      ? Math.round((summary.correct_count / summary.completed_count) * 100)
      : 0;

  return (
    <div className="section-container space-y-6">
      {/* Header */}
      <div className="page-header">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/problem-sets/${problemSetId}`)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Problem Set
        </Button>
        <h1 className="page-title">Review Complete</h1>
        <p className="page-description">
          {problemSetName} &middot; {subjectName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-section">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
            <div className="text-2xl font-bold">{summary.total_problems}</div>
            <p className="text-xs text-muted-foreground">Total Problems</p>
          </CardContent>
        </Card>

        <Card className="card-section">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.correct_count}
            </div>
            <p className="text-xs text-muted-foreground">Correct</p>
          </CardContent>
        </Card>

        <Card className="card-section">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600 dark:text-red-400" />
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.incorrect_count}
            </div>
            <p className="text-xs text-muted-foreground">Incorrect</p>
          </CardContent>
        </Card>

        <Card className="card-section">
          <CardContent className="pt-6 text-center">
            <SkipForward className="h-6 w-6 mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {summary.skipped_count}
            </div>
            <p className="text-xs text-muted-foreground">Skipped</p>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy */}
      {summary.completed_count > 0 && (
        <Card className="card-section">
          <CardContent className="pt-6">
            <div className="text-center">
              <div
                className={`text-4xl font-bold ${
                  accuracy >= 80
                    ? 'text-green-600 dark:text-green-400'
                    : accuracy >= 50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                }`}
              >
                {accuracy}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
              <div className="w-full bg-muted rounded-full h-3 mt-3 max-w-md mx-auto">
                <div
                  className={`rounded-full h-3 transition-all ${
                    accuracy >= 80
                      ? 'bg-green-500'
                      : accuracy >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => router.push(`/problem-sets/${problemSetId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Problem Set
        </Button>
        <Button
          onClick={() => router.push(`/problem-sets/${problemSetId}`)}
          className="bg-primary"
        >
          <Play className="h-4 w-4 mr-2" />
          Start New Session
        </Button>
      </div>
    </div>
  );
}
