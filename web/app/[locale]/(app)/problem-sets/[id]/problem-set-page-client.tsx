'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import { BackLink } from '@/components/back-link';
import {
  Play,
  Plus,
  Settings,
  Users,
  Globe,
  Sparkles,
  LogIn,
  Copy,
} from 'lucide-react';
import { ProblemSetSharingLevel } from '@/lib/schemas';
import {
  ProblemInSet,
  ProblemSetWithDetails,
  ProblemSetProgress,
  ProblemSetPageClientProps,
} from '@/lib/types';
import ResumeSessionDialog from '@/components/review/resume-session-dialog';
import EditSmartSetDialog from '@/components/review/edit-smart-set-dialog';
import SmartFilterCriteriaDisplay from '@/components/review/smart-filter-display';
import ProblemSetProblemsTable from './problem-set-problems-table';
import ProblemSetEditDialog from '../problem-set-edit-dialog';
import CopyProblemSetDialog from '@/components/copy-problem-set-dialog';
import { UserProfileCard } from '@/components/user-profile-card';
import { SocialActionsBar } from '@/components/social-actions-bar';
import { FilterConfig, SessionConfig } from '@/lib/types';
import { useReviewSession } from '@/lib/hooks/useReviewSession';

export default function ProblemSetPageClient({
  initialProblemSet,
  isAuthenticated = true,
  ownerProfile,
  initialStats,
  initialSocialState,
  hasUsername = true,
  backHref = '/problem-sets',
}: ProblemSetPageClientProps) {
  const t = useTranslations('ProblemSets');
  const tCommon = useTranslations('Common');
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
  const [editSmartDialog, setEditSmartDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [copyDialog, setCopyDialog] = useState(false);
  const {
    sessionLoading,
    resumeDialog,
    startReview,
    resumeSession,
    startNewSession,
    setResumeDialogOpen,
  } = useReviewSession();

  // Build tag_id → tag_name map from loaded problems
  const tagNames = useMemo(() => {
    const map: Record<string, string> = {};
    problemSet.problems.forEach(p => {
      p.tags?.forEach(tag => {
        if (!map[tag.id]) map[tag.id] = tag.name;
      });
    });
    return map;
  }, [problemSet.problems]);

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
    return null;
  }, [problemSet.id]);

  // Load progress data on mount (owner only)
  useEffect(() => {
    if (!problemSet.isOwner) {
      setProgressLoading(false);
      return;
    }
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
  }, [fetchProgress, problemSet.isOwner]);

  const handleAddProblems = () => {
    router.push(`/problem-sets/${problemSet.id}/add-problems`);
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
        return t('private');
      case ProblemSetSharingLevel.enum.limited:
        return t('limited');
      case ProblemSetSharingLevel.enum.public:
        return t('public');
      default:
        return t('private');
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

  const handleEditSmartSetSuccess = () => {
    router.refresh();
    window.location.reload();
  };

  const handleEditSuccess = () => {
    router.refresh();
    window.location.reload();
  };

  const handleProblemsRemoved = (problemIds: string[]) => {
    setProblemSet(prev => ({
      ...prev,
      problems: prev.problems.filter(p => !problemIds.includes(p.id)),
      problem_count: prev.problem_count - problemIds.length,
    }));

    // Refresh progress
    if (problemSet.isOwner) {
      setProgressLoading(true);
      fetchProgress().then(data => {
        if (data) setProgress(data);
        setProgressLoading(false);
      });
    }
  };

  return (
    <div className="section-container">
      {/* Header */}
      <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center space-x-4">
          <BackLink onClick={() => router.push(backHref)}>
            {tCommon('back')}
          </BackLink>
          <div className="min-w-0">
            <h1 className="page-title break-words">{problemSet.name}</h1>
            {problemSet.isOwner ? (
              <p
                className="page-description cursor-pointer hover:underline"
                onClick={() =>
                  router.push(`/subjects/${problemSet.subject_id}/problems`)
                }
              >
                {problemSet.subject_name}
              </p>
            ) : (
              <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {problemSet.problem_count} problem
                  {problemSet.problem_count !== 1 ? 's' : ''}
                </span>
                {ownerProfile && (
                  <>
                    <span className="text-muted-foreground/40">|</span>
                    <span>{t('sharedBy')}</span>
                    <UserProfileCard profile={ownerProfile} />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {problemSet.is_smart && (
            <Badge
              variant="outline"
              className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {t('smart')}
            </Badge>
          )}
          <Badge variant={getSharingVariant(problemSet.sharing_level)}>
            {getSharingIcon(problemSet.sharing_level)}
            <span className="ml-1">
              {getSharingLabel(problemSet.sharing_level)}
            </span>
          </Badge>
          {problemSet.isOwner && (
            <Button variant="outline" onClick={() => setEditDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              {tCommon('edit')}
            </Button>
          )}
          {problemSet.is_smart && problemSet.isOwner && (
            <Button variant="outline" onClick={() => setEditSmartDialog(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              {t('filters')}
            </Button>
          )}
          {/* Copy to My Library (non-owners, when allowed) */}
          {isAuthenticated &&
            !problemSet.isOwner &&
            problemSet.allow_copying && (
              <Button variant="outline" onClick={() => setCopyDialog(true)}>
                <Copy className="h-4 w-4 mr-2" />
                {t('copyToMyLibrary')}
              </Button>
            )}
          {isAuthenticated ? (
            <Button
              onClick={() => startReview(problemSet.id)}
              disabled={!!sessionLoading}
            >
              <Play className="h-4 w-4 mr-2" />
              {sessionLoading ? t('starting') : t('startReview')}
            </Button>
          ) : (
            <Button
              onClick={() =>
                router.push(
                  `/auth/login?redirect=/problem-sets/${problemSet.id}`
                )
              }
            >
              <LogIn className="h-4 w-4 mr-2" />
              {t('loginToReview')}
            </Button>
          )}
        </div>
      </div>

      {/* Social Actions (non-private sets) */}
      {problemSet.sharing_level !== 'private' && (
        <SocialActionsBar
          problemSetId={problemSet.id}
          isShared
          isAuthenticated={isAuthenticated}
          initialStats={initialStats}
          initialSocialState={initialSocialState}
          isOwner={problemSet.isOwner}
        />
      )}

      {/* Description */}
      {problemSet.description && (
        <Card className="card-section">
          <CardContent className="card-section-content pt-6">
            <RichTextDisplay content={problemSet.description} />
          </CardContent>
        </Card>
      )}

      {/* Progress Stats (owner only) */}
      {problemSet.isOwner && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="card-section">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {progressLoading ? '...' : progress.total_problems}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('totalProblems')}
              </p>
            </CardContent>
          </Card>
          <Card className="card-section">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">
                {progressLoading ? '...' : progress.wrong_count}
              </div>
              <p className="text-xs text-muted-foreground">{t('wrong')}</p>
            </CardContent>
          </Card>
          <Card className="card-section">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {progressLoading ? '...' : progress.needs_review_count}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('needsReview')}
              </p>
            </CardContent>
          </Card>
          <Card className="card-section">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {progressLoading ? '...' : progress.mastered_count}
              </div>
              <p className="text-xs text-muted-foreground">{t('mastered')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Smart filter criteria */}
      {problemSet.is_smart && problemSet.filter_config && (
        <SmartFilterCriteriaDisplay
          filterConfig={problemSet.filter_config as FilterConfig}
          hideStatus={!problemSet.isOwner}
          tagNames={tagNames}
        />
      )}

      {/* Add Problems button (owner, non-smart) */}
      {problemSet.isOwner && !problemSet.is_smart && (
        <div className="flex items-center mb-4">
          <Button onClick={handleAddProblems} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            {t('addProblems')}
          </Button>
        </div>
      )}

      {/* Problems Table */}
      {problemSet.problems.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t('noProblemsInSet')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {problemSet.is_smart
                  ? t('noProblemsMatchFilter')
                  : problemSet.isOwner
                    ? t('addProblemsHint')
                    : t('problemSetEmpty')}
              </p>
              {problemSet.isOwner && !problemSet.is_smart && (
                <Button onClick={handleAddProblems}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addProblems')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <ProblemSetProblemsTable
          problems={problemSet.problems}
          problemSetId={problemSet.id}
          isOwner={!!problemSet.isOwner}
          isSmart={problemSet.is_smart}
          onProblemsRemoved={handleProblemsRemoved}
          allowCopying={problemSet.allow_copying}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Resume Session Dialog */}
      {resumeDialog.session && (
        <ResumeSessionDialog
          open={resumeDialog.open}
          onOpenChange={setResumeDialogOpen}
          session={resumeDialog.session}
          onResume={resumeSession}
          onStartNew={startNewSession}
          isLoading={!!sessionLoading}
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

      {/* Edit Problem Set Dialog */}
      <ProblemSetEditDialog
        open={editDialog}
        onOpenChange={setEditDialog}
        problemSet={{
          id: problemSet.id,
          name: problemSet.name,
          description: problemSet.description,
          sharing_level: problemSet.sharing_level,
          shared_with_emails: problemSet.shared_with_emails,
          allow_copying: problemSet.allow_copying,
          is_listed: problemSet.is_listed,
          discovery_subject: problemSet.discovery_subject,
          problem_count: problemSet.problem_count,
        }}
        hasUsername={hasUsername}
        onSuccess={handleEditSuccess}
      />

      {/* Copy Problem Set Dialog */}
      <CopyProblemSetDialog
        open={copyDialog}
        onOpenChange={setCopyDialog}
        problemSetId={problemSet.id}
        problemSetName={problemSet.name}
        problemCount={problemSet.problem_count}
        isSmart={problemSet.is_smart}
      />
    </div>
  );
}
