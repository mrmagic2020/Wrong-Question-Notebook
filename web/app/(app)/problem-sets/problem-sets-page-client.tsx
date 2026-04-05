'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
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
  Heart,
  Copy,
  Users,
  Globe,
  Lock,
  Share,
  Sparkles,
  Bookmark,
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
import ProblemSetEditDialog from '@/app/(app)/problem-sets/problem-set-edit-dialog';
import CreateSmartSetDialog from '@/components/review/create-smart-set-dialog';
import ResumeSessionDialog from '@/components/review/resume-session-dialog';
import { ProblemSetWithDetails, ProblemSetsPageClientProps } from '@/lib/types';
import { useReviewSession } from '@/lib/hooks/useReviewSession';

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function ProblemSetsPageClient({
  initialProblemSets,
  statsMap = {},
  hasUsername = true,
}: ProblemSetsPageClientProps) {
  const router = useRouter();
  const [problemSets, setProblemSets] =
    useState<ProblemSetWithDetails[]>(initialProblemSets);
  const [searchText, setSearchText] = useState('');
  const [tab, setTab] = useState<'my-sets' | 'favourites'>('my-sets');
  const [favouriteData, setFavouriteData] = useState<{
    sets: ProblemSetWithDetails[];
    loaded: boolean;
    loading: boolean;
    favSetIds: Set<string>;
    favStatsMap: Record<
      string,
      { view_count: number; like_count: number; copy_count: number }
    >;
  }>({
    sets: [],
    loaded: false,
    loading: false,
    favSetIds: new Set(),
    favStatsMap: {},
  });
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

  // Fetch favourites from API when tab is activated
  const loadFavourites = useCallback(async () => {
    if (favouriteData.loaded || favouriteData.loading) return;
    setFavouriteData(prev => ({ ...prev, loading: true }));

    try {
      const res = await fetch('/api/problem-sets/favourites');
      const json = await res.json();
      if (res.ok && json.data) {
        const favIds = new Set<string>(json.data.map((s: any) => s.id));
        const favStats: Record<
          string,
          { view_count: number; like_count: number; copy_count: number }
        > = {};
        for (const s of json.data) {
          if (s.stats) favStats[s.id] = s.stats;
        }
        setFavouriteData({
          sets: json.data,
          loaded: true,
          loading: false,
          favSetIds: favIds,
          favStatsMap: favStats,
        });
      } else {
        setFavouriteData(prev => ({ ...prev, loaded: true, loading: false }));
      }
    } catch {
      setFavouriteData(prev => ({ ...prev, loaded: true, loading: false }));
    }
  }, [favouriteData.loaded, favouriteData.loading]);

  useEffect(() => {
    if (tab === 'favourites') {
      loadFavourites();
    }
  }, [tab, loadFavourites]);

  const filteredProblemSets = useMemo(() => {
    let sets: ProblemSetWithDetails[];

    if (tab === 'favourites') {
      sets = favouriteData.sets;
    } else {
      sets = problemSets;
    }

    const q = searchText.trim().toLowerCase();
    if (!q) return sets;

    return sets.filter(
      problemSet =>
        problemSet.name.toLowerCase().includes(q) ||
        problemSet.description?.toLowerCase().includes(q) ||
        problemSet.subject_name.toLowerCase().includes(q)
    );
  }, [problemSets, searchText, tab, favouriteData.sets]);

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
      toast.success('Problem set deleted successfully');
    } catch (error) {
      console.error('Error deleting problem set:', error);
      toast.error('Failed to delete problem set');
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

  if (problemSets.length === 0) {
    return (
      <div className="section-container">
        <PageHeader
          title="Problem Sets"
          description="Organize and review specific groups of problems."
        />

        <div className="flex flex-col items-center py-12">
          <div className="mx-auto w-20 h-20 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
            <Plus className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No problem sets yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-md text-center">
            Problem sets let you group problems together for focused review
            sessions. Get started by creating your first set.
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
                  Create Smart Set
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Auto-populate based on filters like status, tags, or subject
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
                  Build Manually
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Pick specific problems from a subject to create a custom set
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
        title="Problem Sets"
        description="Organize and review specific groups of problems."
        actions={
          <>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problem sets..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setSmartSetDialogOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Create New Set
            </Button>
          </>
        }
      />

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <Button
          variant={tab === 'my-sets' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('my-sets')}
          className="rounded-xl"
        >
          My Sets
        </Button>
        <Button
          variant={tab === 'favourites' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('favourites')}
          className="rounded-xl"
        >
          <Bookmark className="h-4 w-4 mr-1.5" />
          Favourites
        </Button>
      </div>

      {/* Loading state for favourites */}
      {tab === 'favourites' && favouriteData.loading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      )}

      {/* Problem Sets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProblemSets.map(problemSet => {
          const isPrivate =
            problemSet.sharing_level === ProblemSetSharingLevel.enum.private;
          const stats =
            statsMap[problemSet.id] || favouriteData.favStatsMap[problemSet.id];

          return (
            <div
              key={problemSet.id}
              role="link"
              tabIndex={0}
              className="group flex h-[220px] cursor-pointer flex-col rounded-2xl border border-amber-200/40 bg-gradient-to-br from-white to-amber-50/30 p-5 transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 dark:border-gray-700/40 dark:from-gray-800/60 dark:to-gray-800/30"
              onClick={() => router.push(`/problem-sets/${problemSet.id}`)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/problem-sets/${problemSet.id}`);
                }
              }}
            >
              {/* Top: badges, title, description */}
              <div className="flex-1 min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    {problemSet.subject_name}
                  </span>
                  {problemSet.is_smart && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-700 dark:text-amber-400">
                      <Sparkles className="h-3 w-3" />
                      Smart
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    {favouriteData.favSetIds.has(problemSet.id) && (
                      <Bookmark className="h-3.5 w-3.5 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
                    )}
                    {isPrivate ? (
                      <Lock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <Badge
                        variant={getSharingVariant(problemSet.sharing_level)}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {getSharingIcon(problemSet.sharing_level)}
                        <span className="ml-0.5">
                          {getSharingLabel(problemSet.sharing_level)}
                        </span>
                      </Badge>
                    )}
                  </div>
                </div>

                <h3 className="mb-1 truncate text-lg font-semibold text-gray-900 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-400">
                  {problemSet.name}
                </h3>

                {problemSet.description && (
                  <div className="line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    <RichTextDisplay content={problemSet.description} />
                  </div>
                )}
              </div>

              {/* Bottom: stats + actions */}
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                  <span>
                    {problemSet.problem_count} problem
                    {problemSet.problem_count !== 1 ? 's' : ''}
                  </span>
                  {!isPrivate && stats && (
                    <>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {formatCount(stats.view_count)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                        {formatCount(stats.like_count)}
                      </span>
                      {problemSet.allow_copying && (
                        <span className="flex items-center gap-1">
                          <Copy className="h-3.5 w-3.5" />
                          {formatCount(stats.copy_count)}
                        </span>
                      )}
                    </>
                  )}
                  {isPrivate && (
                    <span className="text-gray-400 dark:text-gray-500">
                      Private
                    </span>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={e => e.stopPropagation()}
                    >
                      <Settings className="h-3.5 w-3.5" />
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
                      View Details
                    </DropdownMenuItem>
                    {problemSet.isOwner !== false && (
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          handleEditClick(problemSet);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      disabled={sessionLoading === problemSet.id}
                      onClick={e => {
                        e.stopPropagation();
                        startReview(problemSet.id);
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {sessionLoading === problemSet.id
                        ? 'Starting...'
                        : 'Start Review'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(
                          `${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'}/problem-sets/${problemSet.id}`
                        );
                        toast.success('Link copied to clipboard');
                      }}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    {problemSet.isOwner !== false && (
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteClick(problemSet.id, problemSet.name);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProblemSets.length === 0 && searchText && (
        <div className="text-center py-12">
          <p className="page-description">
            No problem sets found matching &ldquo;{searchText}&rdquo;
          </p>
        </div>
      )}

      {filteredProblemSets.length === 0 &&
        !searchText &&
        tab === 'favourites' &&
        !favouriteData.loading && (
          <div className="flex flex-col items-center py-12">
            <div className="mx-auto w-20 h-20 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Bookmark className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No favourites yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md text-center">
              You haven&apos;t favourited any problem sets yet. Browse the
              Discover page to find sets to save.
            </p>
          </div>
        )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.open}
        onCancel={() => setDeleteDialog(prev => ({ ...prev, open: false }))}
        onConfirm={handleConfirmDelete}
        title="Delete Problem Set"
        message={`Are you sure you want to delete "${deleteDialog.problemSetName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Edit Dialog */}
      {editDialog.problemSet && (
        <ProblemSetEditDialog
          open={editDialog.open}
          onOpenChange={open => setEditDialog(prev => ({ ...prev, open }))}
          problemSet={editDialog.problemSet}
          hasUsername={hasUsername}
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
