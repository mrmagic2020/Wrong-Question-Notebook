'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Play,
  Plus,
  Trash2,
  Search,
  Settings,
  Users,
  Globe,
  XCircle,
  Clock,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProblemStatus, ProblemSetSharingLevel } from '@/lib/schemas';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  getProblemTypeDisplayName,
  getProblemStatusDisplayName,
} from '@/lib/common-utils';
import {
  ProblemInSet,
  ProblemSetWithDetails,
  ProblemSetProgress,
  ProblemSetPageClientProps,
} from '@/lib/types';
import ResumeSessionDialog from '@/components/review/resume-session-dialog';
import EditSmartSetDialog from '@/components/review/edit-smart-set-dialog';
import { FilterConfig, SessionConfig } from '@/lib/types';

export default function ProblemSetPageClient({
  initialProblemSet,
}: ProblemSetPageClientProps) {
  const router = useRouter();
  const [problemSet, setProblemSet] = useState<
    ProblemSetWithDetails & { problems: ProblemInSet[] }
  >(initialProblemSet);
  const [progress, setProgress] = useState<ProblemSetProgress>({
    total_problems: 0,
    wrong_count: 0,
    needs_review_count: 0,
    mastered_count: 0,
  });
  const [progressLoading, setProgressLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    problemIds: string[];
    count: number;
  }>({
    open: false,
    problemIds: [],
    count: 0,
  });
  const [editSmartDialog, setEditSmartDialog] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [resumeDialog, setResumeDialog] = useState<{
    open: boolean;
    session: any;
  }>({
    open: false,
    session: null,
  });

  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/problem-sets/${problemSet.id}/progress`
      );
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
    // Return null instead of progress to avoid dependency loop
    return null;
  }, [problemSet.id]);

  // Load progress data on component mount
  useEffect(() => {
    const loadInitialProgress = async () => {
      try {
        const progressData = await fetchProgress();
        if (progressData) {
          setProgress(progressData);
        }
      } catch (error) {
        console.error('Error loading initial progress:', error);
      } finally {
        setProgressLoading(false);
      }
    };

    loadInitialProgress();
  }, [fetchProgress]);

  // Filter problems based on search text
  const filteredProblems = problemSet.problems.filter(
    problem =>
      problem.title.toLowerCase().includes(searchText.toLowerCase()) ||
      problem.content?.toLowerCase().includes(searchText.toLowerCase()) ||
      problem.tags.some(tag =>
        tag.name.toLowerCase().includes(searchText.toLowerCase())
      )
  );

  const handleAddProblems = () => {
    router.push(`/problem-sets/${problemSet.id}/add-problems`);
  };

  const handleRemoveProblems = (problemIds: string[]) => {
    setDeleteDialog({
      open: true,
      problemIds,
      count: problemIds.length,
    });
  };

  const handleConfirmRemove = async () => {
    const { problemIds } = deleteDialog;

    if (!problemIds.length) {
      toast.error('No problems selected for removal');
      return;
    }

    try {
      const response = await fetch(
        `/api/problem-sets/${problemSet.id}/problems`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ problem_ids: problemIds }),
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to remove problems from set';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          // If response is not JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Update local state
      setProblemSet(prev => ({
        ...prev,
        problems: prev.problems.filter(p => !problemIds.includes(p.id)),
        problem_count: prev.problem_count - problemIds.length,
      }));

      // Update progress
      setProgressLoading(true);
      const updatedProgress = await fetchProgress();
      if (updatedProgress) {
        setProgress(updatedProgress);
      }
      setProgressLoading(false);

      setSelectedProblems([]);
      toast.success(
        `Removed ${problemIds.length} problem${problemIds.length !== 1 ? 's' : ''} from set`
      );
    } catch (error) {
      console.error('Error removing problems:', error);
      toast.error('Failed to remove problems from set');
    } finally {
      setDeleteDialog({ open: false, problemIds: [], count: 0 });
    }
  };

  const getSharingIcon = (sharingLevel: ProblemSetSharingLevel) => {
    switch (sharingLevel) {
      case ProblemSetSharingLevel.enum.private:
        return <Settings className="h-4 w-4" />;
      case ProblemSetSharingLevel.enum.limited:
        return <Users className="h-4 w-4" />;
      case ProblemSetSharingLevel.enum.public:
        return <Globe className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getSharingLabel = (sharingLevel: ProblemSetSharingLevel) => {
    switch (sharingLevel) {
      case ProblemSetSharingLevel.enum.private:
        return 'Private';
      case ProblemSetSharingLevel.enum.limited:
        return 'Limited';
      case ProblemSetSharingLevel.enum.public:
        return 'Public';
      default:
        return 'Private';
    }
  };

  const getSharingVariant = (sharingLevel: ProblemSetSharingLevel) => {
    switch (sharingLevel) {
      case ProblemSetSharingLevel.enum.private:
        return 'secondary';
      case ProblemSetSharingLevel.enum.limited:
        return 'default';
      case ProblemSetSharingLevel.enum.public:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: ProblemStatus) => {
    switch (status) {
      case ProblemStatus.enum.wrong:
        return <XCircle className="h-4 w-4 text-destructive" />;
      case ProblemStatus.enum.needs_review:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case ProblemStatus.enum.mastered:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const handleStartReview = async () => {
    setSessionLoading(true);
    try {
      const res = await fetch(
        `/api/problem-sets/${problemSet.id}/start-session`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to start session');
      }
      const data = await res.json();
      const result = data.data;

      if (result.hasActiveSession) {
        // Show resume dialog
        setResumeDialog({ open: true, session: result.session });
      } else {
        // Navigate to session-aware review page
        router.push(
          `/problem-sets/${problemSet.id}/review?sessionId=${result.sessionId}`
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to start review'
      );
    } finally {
      setSessionLoading(false);
    }
  };

  const handleResumeSession = (sessionId: string) => {
    setResumeDialog({ open: false, session: null });
    router.push(`/problem-sets/${problemSet.id}/review?sessionId=${sessionId}`);
  };

  const handleStartNewSession = async () => {
    setResumeDialog({ open: false, session: null });
    setSessionLoading(true);
    try {
      // Deactivate the old session
      if (resumeDialog.session?.id) {
        await fetch(`/api/review-sessions/${resumeDialog.session.id}`, {
          method: 'DELETE',
        });
      }
      // Start a fresh session
      const res = await fetch(
        `/api/problem-sets/${problemSet.id}/start-session`,
        { method: 'POST' }
      );
      if (!res.ok) {
        throw new Error('Failed to start new session');
      }
      const data = await res.json();
      router.push(
        `/problem-sets/${problemSet.id}/review?sessionId=${data.data.sessionId}`
      );
    } catch {
      toast.error('Failed to start new session');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleEditSmartSetSuccess = () => {
    // Reload the page to get updated data
    router.refresh();
    window.location.reload();
  };

  const handleProblemClick = (problemId: string) => {
    router.push(`/problem-sets/${problemSet.id}/review?problemId=${problemId}`);
  };

  const handleSelectProblem = (problemId: string) => {
    setSelectedProblems(prev =>
      prev.includes(problemId)
        ? prev.filter(id => id !== problemId)
        : [...prev, problemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProblems.length === filteredProblems.length) {
      setSelectedProblems([]);
    } else {
      setSelectedProblems(filteredProblems.map(p => p.id));
    }
  };

  return (
    <div className="section-container">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/problem-sets')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="page-title">{problemSet.name}</h1>
            <p
              className="page-description cursor-pointer hover:underline"
              onClick={() =>
                router.push(`/subjects/${problemSet.subject_id}/problems`)
              }
            >
              {problemSet.subject_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {problemSet.is_smart && (
            <Badge
              variant="outline"
              className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Smart
            </Badge>
          )}
          <Badge variant={getSharingVariant(problemSet.sharing_level)}>
            {getSharingIcon(problemSet.sharing_level)}
            <span className="ml-1">
              {getSharingLabel(problemSet.sharing_level)}
            </span>
          </Badge>
          {problemSet.is_smart && problemSet.isOwner && (
            <Button variant="outline" onClick={() => setEditSmartDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          )}
          <Button onClick={handleStartReview} disabled={sessionLoading}>
            <Play className="h-4 w-4 mr-2" />
            {sessionLoading ? 'Starting...' : 'Start Review'}
          </Button>
        </div>
      </div>

      {/* Description */}
      {problemSet.description && (
        <Card className="card-section">
          <CardContent className="card-section-content pt-6">
            <RichTextDisplay content={problemSet.description} />
          </CardContent>
        </Card>
      )}

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="card-section">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {progressLoading ? '...' : progress.total_problems}
            </div>
            <p className="text-xs text-muted-foreground">Total Problems</p>
          </CardContent>
        </Card>
        <Card className="card-section">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">
              {progressLoading ? '...' : progress.wrong_count}
            </div>
            <p className="text-xs text-muted-foreground">Wrong</p>
          </CardContent>
        </Card>
        <Card className="card-section">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {progressLoading ? '...' : progress.needs_review_count}
            </div>
            <p className="text-xs text-muted-foreground">Needs Review</p>
          </CardContent>
        </Card>
        <Card className="card-section">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {progressLoading ? '...' : progress.mastered_count}
            </div>
            <p className="text-xs text-muted-foreground">Mastered</p>
          </CardContent>
        </Card>
      </div>

      {/* Smart set filter info */}
      {problemSet.is_smart && problemSet.filter_config && (
        <div className="rounded-lg border border-amber-200/40 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Smart Filter Criteria
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {problemSet.filter_config.statuses?.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                Status:{' '}
                {problemSet.filter_config.statuses
                  .map((s: string) =>
                    s === 'needs_review'
                      ? 'Needs Review'
                      : s.charAt(0).toUpperCase() + s.slice(1)
                  )
                  .join(', ')}
              </Badge>
            )}
            {problemSet.filter_config.problem_types?.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                Type:{' '}
                {problemSet.filter_config.problem_types
                  .map((t: string) =>
                    t === 'mcq'
                      ? 'MCQ'
                      : t === 'short'
                        ? 'Short Answer'
                        : 'Extended'
                  )
                  .join(', ')}
              </Badge>
            )}
            {problemSet.filter_config.days_since_review != null && (
              <Badge variant="secondary" className="text-xs">
                Not reviewed in {problemSet.filter_config.days_since_review}{' '}
                days
              </Badge>
            )}
            {problemSet.filter_config.include_never_reviewed && (
              <Badge variant="secondary" className="text-xs">
                Includes never-reviewed
              </Badge>
            )}
            {!problemSet.filter_config.statuses?.length &&
              !problemSet.filter_config.problem_types?.length &&
              problemSet.filter_config.days_since_review == null && (
                <span className="text-xs text-muted-foreground">
                  All problems in subject
                </span>
              )}
          </div>
        </div>
      )}

      {/* Actions and Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {problemSet.isOwner && !problemSet.is_smart && (
            <Button onClick={handleAddProblems} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Problems
            </Button>
          )}
          {problemSet.isOwner &&
            !problemSet.is_smart &&
            selectedProblems.length > 0 && (
              <Button
                onClick={() => handleRemoveProblems(selectedProblems)}
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Selected ({selectedProblems.length})
              </Button>
            )}
        </div>

        <div className="flex items-center space-x-2">
          {problemSet.isOwner &&
            !problemSet.is_smart &&
            filteredProblems.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedProblems.length === filteredProblems.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            )}
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Problems List */}
      {filteredProblems.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchText ? 'No problems found' : 'No problems in this set'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchText
                  ? `No problems match "${searchText}"`
                  : problemSet.is_smart
                    ? 'No problems match the current filter criteria. Try editing the smart set settings.'
                    : 'Add problems to this set to get started with reviews.'}
              </p>
              {!searchText && problemSet.isOwner && !problemSet.is_smart && (
                <Button onClick={handleAddProblems}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Problems
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredProblems.map(problem => (
            <Card
              key={problem.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                selectedProblems.includes(problem.id)
                  ? 'ring-2 ring-primary'
                  : ''
              }`}
              onClick={() => handleProblemClick(problem.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      {problemSet.isOwner && !problemSet.is_smart && (
                        <input
                          type="checkbox"
                          checked={selectedProblems.includes(problem.id)}
                          onChange={e => {
                            e.stopPropagation();
                            handleSelectProblem(problem.id);
                          }}
                          onClick={e => e.stopPropagation()}
                          className="rounded"
                        />
                      )}
                      <h3 className="font-semibold truncate">
                        {problem.title}
                      </h3>
                      <Badge variant="outline">
                        {getProblemTypeDisplayName(problem.problem_type)}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(problem.status)}
                        <span className="text-sm text-muted-foreground">
                          {getProblemStatusDisplayName(problem.status)}
                        </span>
                      </div>
                    </div>
                    {problem.content && (
                      <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        <RichTextDisplay content={problem.content} />
                      </div>
                    )}
                    {problem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {problem.tags.map(tag => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.open}
        onCancel={() => setDeleteDialog(prev => ({ ...prev, open: false }))}
        onConfirm={handleConfirmRemove}
        title="Remove Problems from Set"
        message={`Are you sure you want to remove ${deleteDialog.count} problem${deleteDialog.count !== 1 ? 's' : ''} from this problem set?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Resume Session Dialog */}
      {resumeDialog.session && (
        <ResumeSessionDialog
          open={resumeDialog.open}
          onOpenChange={open => setResumeDialog(prev => ({ ...prev, open }))}
          session={resumeDialog.session}
          onResume={handleResumeSession}
          onStartNew={handleStartNewSession}
          isLoading={sessionLoading}
        />
      )}

      {/* Edit Smart Set Dialog */}
      {problemSet.is_smart &&
        problemSet.filter_config &&
        problemSet.session_config && (
          <EditSmartSetDialog
            open={editSmartDialog}
            onOpenChange={setEditSmartDialog}
            onSuccess={handleEditSmartSetSuccess}
            problemSetId={problemSet.id}
            problemSetName={problemSet.name}
            subjectId={problemSet.subject_id}
            subjectName={problemSet.subject_name}
            filterConfig={problemSet.filter_config as FilterConfig}
            sessionConfig={problemSet.session_config as SessionConfig}
          />
        )}
    </div>
  );
}
