'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import {
  Search,
  Plus,
  Play,
  Settings,
  Trash2,
  Eye,
  Users,
  Globe,
  Share,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProblemSetSharingLevel } from '@/lib/schemas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import ProblemSetEditDialog from './problem-set-edit-dialog';
import CreateSmartSetDialog from '@/components/review/create-smart-set-dialog';
import ResumeSessionDialog from '@/components/review/resume-session-dialog';
import { ProblemSetWithDetails, ProblemSetsPageClientProps } from '@/lib/types';
import { useReviewSession } from '@/lib/hooks/useReviewSession';
import { useTranslations } from 'next-intl';

export default function ProblemSetsPageClient({
  initialProblemSets,
}: ProblemSetsPageClientProps) {
  const router = useRouter();
  const t = useTranslations('ProblemSets');
  const tReview = useTranslations('Review');
  const tCommon = useTranslations('Common');
  const [problemSets, setProblemSets] =
    useState<ProblemSetWithDetails[]>(initialProblemSets);
  const [searchText, setSearchText] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    problemSetId: string | null;
    problemSetName: string;
  }>({
    open: false,
    problemSetId: null,
    problemSetName: '',
  });

  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    problemSet: ProblemSetWithDetails | null;
  }>({
    open: false,
    problemSet: null,
  });
  const [smartSetDialogOpen, setSmartSetDialogOpen] = useState(false);
  const {
    sessionLoading,
    resumeDialog,
    startReview,
    resumeSession,
    startNewSession,
    setResumeDialogOpen,
  } = useReviewSession();

  const filteredProblemSets = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return problemSets;

    return problemSets.filter(
      problemSet =>
        problemSet.name.toLowerCase().includes(q) ||
        problemSet.description?.toLowerCase().includes(q) ||
        problemSet.subject_name.toLowerCase().includes(q)
    );
  }, [problemSets, searchText]);

  const handleDeleteClick = (problemSetId: string, problemSetName: string) => {
    setDeleteDialog({
      open: true,
      problemSetId,
      problemSetName,
    });
  };

  const handleEditClick = (problemSet: ProblemSetWithDetails) => {
    setEditDialog({
      open: true,
      problemSet,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.problemSetId) return;

    try {
      const response = await fetch(
        `/api/problem-sets/${deleteDialog.problemSetId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete error:', errorData);
        throw new Error(errorData.message || 'Failed to delete problem set');
      }

      setProblemSets(prev =>
        prev.filter(ps => ps.id !== deleteDialog.problemSetId)
      );
      toast.success(t('problemSetDeleted'));
    } catch (error) {
      console.error('Error deleting problem set:', error);
      toast.error(t('failedToDelete'));
    } finally {
      setDeleteDialog({ open: false, problemSetId: null, problemSetName: '' });
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

  if (problemSets.length === 0) {
    return (
      <div className="section-container">
        <PageHeader title={t('title')} description={t('subtitle')} />

        <div className="flex flex-col items-center py-12">
          <div className="mx-auto w-20 h-20 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
            <Plus className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('empty')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-md text-center">
            {t('emptyDescription')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
            <button
              onClick={() => setSmartSetDialogOpen(true)}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-amber-200/40 dark:border-amber-800/30 bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-950/40 dark:to-orange-900/20 p-6 text-left transition-all hover:shadow-md hover:scale-[1.02]"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {t('createSmartSet')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('smartSetAutoPopulate')}
                </p>
              </div>
            </button>

            <button
              onClick={() => router.push('/subjects')}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-blue-200/40 dark:border-blue-800/30 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 p-6 text-left transition-all hover:shadow-md hover:scale-[1.02]"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {t('buildManually')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('buildManuallyPick')}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Create Smart Set Dialog */}
        <CreateSmartSetDialog
          open={smartSetDialogOpen}
          onOpenChange={setSmartSetDialogOpen}
          onSuccess={() => {
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }}
        />
      </div>
    );
  }

  return (
    <div className="section-container">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setSmartSetDialogOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('createNewSet')}
            </Button>
          </>
        }
      />

      {/* Problem Sets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProblemSets.map(problemSet => (
          <Card
            key={problemSet.id}
            className="flex h-full flex-col interactive-card cursor-pointer"
            onClick={() => router.push(`/problem-sets/${problemSet.id}`)}
          >
            <CardHeader className="card-section-header">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="card-section-title truncate">
                    {problemSet.name}
                  </CardTitle>
                  <CardDescription className="card-section-description mt-2">
                    {problemSet.subject_name}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-1 ml-2">
                  <Badge variant={getSharingVariant(problemSet.sharing_level)}>
                    {getSharingIcon(problemSet.sharing_level)}
                    <span className="ml-1">
                      {getSharingLabel(problemSet.sharing_level)}
                    </span>
                  </Badge>
                  {problemSet.is_smart && (
                    <Badge
                      variant="outline"
                      className="self-end border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {tReview('smart')}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-0">
              {problemSet.description && (
                <div className="card-section-description mb-4 line-clamp-2">
                  <RichTextDisplay content={problemSet.description} />
                </div>
              )}

              <div className="mt-auto flex items-center justify-between">
                <div className="card-section-description">
                  {problemSet.problem_count}{' '}
                  {problemSet.problem_count !== 1
                    ? tCommon('problems')
                    : tCommon('problem')}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={e => e.stopPropagation()}
                    >
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        router.push(`/problem-sets/${problemSet.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {tCommon('viewDetails')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        handleEditClick(problemSet);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {tCommon('edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={sessionLoading === problemSet.id}
                      onClick={e => {
                        e.stopPropagation();
                        startReview(problemSet.id);
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {sessionLoading === problemSet.id
                        ? t('starting')
                        : t('startReview')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(
                          `${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'}/problem-sets/${problemSet.id}`
                        );
                        toast.success(t('linkCopied'));
                      }}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      {t('share')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteClick(problemSet.id, problemSet.name);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {tCommon('delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProblemSets.length === 0 && searchText && (
        <div className="text-center py-12">
          <p className="page-description">
            {t('noProblemSetsFound', { searchText })}
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.open}
        onCancel={() => setDeleteDialog(prev => ({ ...prev, open: false }))}
        onConfirm={handleConfirmDelete}
        title={t('deleteProblemSet')}
        message={t('confirmDelete', { name: deleteDialog.problemSetName })}
        confirmText={tCommon('delete')}
        cancelText={tCommon('cancel')}
        variant="destructive"
      />

      {/* Edit Dialog */}
      {editDialog.problemSet && (
        <ProblemSetEditDialog
          open={editDialog.open}
          onOpenChange={open => setEditDialog(prev => ({ ...prev, open }))}
          problemSet={editDialog.problemSet}
          onSuccess={() => {
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }}
        />
      )}

      {/* Create Smart Set Dialog */}
      <CreateSmartSetDialog
        open={smartSetDialogOpen}
        onOpenChange={setSmartSetDialogOpen}
        onSuccess={() => {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }}
      />

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
    </div>
  );
}
