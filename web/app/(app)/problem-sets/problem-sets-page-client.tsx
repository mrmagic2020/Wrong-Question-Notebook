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
import ProblemSetEditDialog from '@/app/(app)/problem-sets/problem-set-edit-dialog';
import CreateSmartSetDialog from '@/components/review/create-smart-set-dialog';
import { ProblemSetWithDetails, ProblemSetsPageClientProps } from '@/lib/types';

export default function ProblemSetsPageClient({
  initialProblemSets,
}: ProblemSetsPageClientProps) {
  const router = useRouter();
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
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Problem Sets</h1>
          <p className="text-muted-foreground mb-8">
            Create problem sets to organize and review specific groups of
            problems.
          </p>
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No problem sets yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by selecting problems from a subject and creating your first
              problem set.
            </p>
            <Button onClick={() => router.push('/subjects')}>
              <Plus className="h-4 w-4 mr-2" />
              Go to Subjects
            </Button>
          </div>
        </div>
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

      {/* Problem Sets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProblemSets.map(problemSet => (
          <Card
            key={problemSet.id}
            className="flex h-full flex-col hover:shadow-md transition-shadow cursor-pointer"
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
                      Smart
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
                  {problemSet.problem_count} problem
                  {problemSet.problem_count !== 1 ? 's' : ''}
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
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        handleEditClick(problemSet);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        router.push(`/problem-sets/${problemSet.id}/review`);
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Review
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(
                          `${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || 'http://localhost:3000'}/problem-sets/${problemSet.id}`
                        );
                        toast.success('Link copied to clipboard');
                      }}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
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
            No problem sets found matching "{searchText}"
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
    </div>
  );
}
