'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Search,
  Plus,
  Play,
  Settings,
  Trash2,
  Eye,
  Users,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { PROBLEM_SET_CONSTANTS } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import ProblemSetEditDialog from '@/app/(app)/problem-sets/problem-set-edit-dialog';

interface ProblemSet {
  id: string;
  name: string;
  description: string | null;
  sharing_level: string;
  subject_id: string;
  subject_name: string;
  problem_count: number;
  created_at: string;
  updated_at: string;
  shared_with_emails?: string[];
}

interface ProblemSetsPageClientProps {
  initialProblemSets: ProblemSet[];
}

export default function ProblemSetsPageClient({
  initialProblemSets,
}: ProblemSetsPageClientProps) {
  const router = useRouter();
  const [problemSets, setProblemSets] =
    useState<ProblemSet[]>(initialProblemSets);
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
    problemSet: ProblemSet | null;
  }>({
    open: false,
    problemSet: null,
  });

  // Filter problem sets based on search text
  const filteredProblemSets = problemSets.filter(
    problemSet =>
      problemSet.name.toLowerCase().includes(searchText.toLowerCase()) ||
      problemSet.description
        ?.toLowerCase()
        .includes(searchText.toLowerCase()) ||
      problemSet.subject_name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleDeleteClick = (problemSetId: string, problemSetName: string) => {
    setDeleteDialog({
      open: true,
      problemSetId,
      problemSetName,
    });
  };

  const handleEditClick = (problemSet: ProblemSet) => {
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

  const getSharingIcon = (sharingLevel: string) => {
    switch (sharingLevel) {
      case PROBLEM_SET_CONSTANTS.SHARING_LEVELS.PRIVATE:
        return <Settings className="h-4 w-4" />;
      case PROBLEM_SET_CONSTANTS.SHARING_LEVELS.LIMITED:
        return <Users className="h-4 w-4" />;
      case PROBLEM_SET_CONSTANTS.SHARING_LEVELS.PUBLIC:
        return <Globe className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getSharingLabel = (sharingLevel: string) => {
    switch (sharingLevel) {
      case PROBLEM_SET_CONSTANTS.SHARING_LEVELS.PRIVATE:
        return 'Private';
      case PROBLEM_SET_CONSTANTS.SHARING_LEVELS.LIMITED:
        return 'Limited';
      case PROBLEM_SET_CONSTANTS.SHARING_LEVELS.PUBLIC:
        return 'Public';
      default:
        return 'Private';
    }
  };

  const getSharingVariant = (sharingLevel: string) => {
    switch (sharingLevel) {
      case PROBLEM_SET_CONSTANTS.SHARING_LEVELS.PRIVATE:
        return 'secondary';
      case PROBLEM_SET_CONSTANTS.SHARING_LEVELS.LIMITED:
        return 'default';
      case PROBLEM_SET_CONSTANTS.SHARING_LEVELS.PUBLIC:
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
    <div>
      <div className="section-container">
        <div className="page-header">
          <h1 className="page-title">Problem Sets</h1>
          <p className="page-description">
            Organize and review specific groups of problems
          </p>
        </div>
      </div>

      {/* Search and Create New Set Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problem sets..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => router.push('/subjects')}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Set
        </Button>
      </div>

      {/* Problem Sets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProblemSets.map(problemSet => (
          <Card
            key={problemSet.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
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
                <Badge
                  variant={getSharingVariant(problemSet.sharing_level)}
                  className="ml-2"
                >
                  {getSharingIcon(problemSet.sharing_level)}
                  <span className="ml-1">
                    {getSharingLabel(problemSet.sharing_level)}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {problemSet.description && (
                <p className="card-section-description mb-4 line-clamp-2">
                  {problemSet.description}
                </p>
              )}

              <div className="flex items-center justify-between">
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
            // Refresh the problem sets list
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
