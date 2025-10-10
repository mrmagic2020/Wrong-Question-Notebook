// Centralized type definitions for the Wong Question Notebook application
// This file contains all application types to eliminate redundancy and improve type safety

import { ProblemType, ProblemStatus, ProblemSetSharingLevel } from './schemas';
import { ColumnDef } from '@tanstack/react-table';

// =====================================================
// Core Entity Types (from database)
// =====================================================

export interface Subject {
  id: string;
  name: string;
  created_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  subject_id: string;
  created_at: string;
}

export interface SimpleTag {
  id: string;
  name: string;
}

export interface Problem {
  id: string;
  title: string;
  content: string | null;
  problem_type: ProblemType;
  correct_answer: string | null;
  auto_mark: boolean;
  status: ProblemStatus;
  subject_id: string;
  created_at: string;
  updated_at: string;
  last_reviewed_date?: string | null;
  solution_text?: string | null;
  assets?: Asset[];
  solution_assets?: Asset[];
  tags?: Tag[];
  isInSet?: boolean;
}

export interface ProblemSetShare {
  id: string;
  shared_with_email: string;
}

export interface ProblemSet {
  id: string;
  name: string;
  description: string | null;
  sharing_level: ProblemSetSharingLevel;
  subject_id: string;
  created_at: string;
  updated_at: string;
  shared_with_emails?: string[];
  problem_set_shares?: ProblemSetShare[];
}

export interface Asset {
  path: string;
  kind?: 'image' | 'pdf';
}

export interface Attempt {
  id: string;
  problem_id: string;
  submitted_answer: string | number | boolean | Record<string, unknown>;
  is_correct: boolean | null;
  cause?: string;
  created_at: string;
}

// =====================================================
// Extended/Computed Types (for UI)
// =====================================================

export interface SubjectWithMetadata extends Subject {
  problem_count?: number;
  last_activity?: string;
}

export interface ProblemWithTags extends Problem {
  tags: Tag[];
}

export interface ProblemSetWithData extends ProblemSet {
  problem_count: number;
  subject_name: string;
  shared_with_emails: string[];
}

export interface ProblemSetWithDetails extends ProblemSet {
  subject_name: string;
  problem_count: number;
  isOwner?: boolean;
}

export interface ProblemInSet extends Problem {
  added_at: string;
  tags: Tag[];
}

export interface ProblemSetProgress {
  total_problems: number;
  wrong_count: number;
  needs_review_count: number;
  mastered_count: number;
}

// =====================================================
// Component Prop Types
// =====================================================

export interface SearchFilters {
  searchText: string;
  problemTypes: ProblemType[];
  statuses: ProblemStatus[];
  tagIds: string[];
}

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onEdit?: (problem: Problem) => void;
  onDelete?: (problemId: string, problemTitle: string) => void;
  onAddToSet?: (problem: Problem) => void;
  onRowClick?: (problem: Problem) => void;
  availableTags?: SimpleTag[];
  onTableReady?: (table: any) => void;
  onSelectionChange?: (selectedProblems: Problem[]) => void;
  resetSelection?: boolean;
  onColumnVisibilityChange?: () => void;
  columnVisibilityStorageKey?: string;
  isAddToSetMode?: boolean;
  meta?: TableMeta;
}

// =====================================================
// Problem Review Types
// =====================================================

export interface SolutionAsset {
  path: string;
  kind?: 'image' | 'pdf';
}

export interface SolutionRevealProps {
  solutionText?: string;
  solutionAssets: SolutionAsset[];
  correctAnswer?: any;
  problemType?: string;
  isRevealed: boolean;
  onToggle: () => void;
}

export interface AssetPreviewProps {
  asset: Asset;
}

export interface AnswerInputProps {
  problemType: ProblemType;
  correctAnswer?: any;
  value: any;
  onChange: (value: any) => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export interface StatusSelectorProps {
  currentStatus: ProblemStatus;
  selectedStatus: ProblemStatus | null;
  onStatusChange: (status: ProblemStatus) => void;
}

// =====================================================
// Problem Set Dialog Types
// =====================================================

export interface ProblemSetEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemSet: {
    id: string;
    name: string;
    description: string | null;
    sharing_level: ProblemSetSharingLevel;
    shared_with_emails?: string[];
  };
  onSuccess?: () => void;
}

// =====================================================
// Add to Set Types
// =====================================================

export interface AddProblemsToSetClientProps {
  problemSet: {
    id: string;
    name: string;
    description: string | null;
    subject_id: string;
    subject_name: string;
  };
  problems: Problem[];
  tagsByProblem: Record<string, Tag[]>;
  availableTags: SimpleTag[];
  problemSetProblemIds: string[];
}

// =====================================================
// Page Client Props
// =====================================================

export interface ProblemsPageClientProps {
  initialProblems: Problem[];
  initialTagsByProblem: Record<string, Tag[]>;
  subjectId: string;
  availableTags: Tag[];
}

export interface ProblemSetsPageClientProps {
  initialProblemSets: ProblemSetWithDetails[];
}

export interface ProblemSetPageClientProps {
  initialProblemSet: ProblemSetWithDetails & {
    problems: ProblemInSet[];
  };
}

export interface TagsPageClientProps {
  initialSubject: Subject;
  initialTags: Tag[];
}

// =====================================================
// Enhanced Table Types
// =====================================================

export interface CompactSearchFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTags: SimpleTag[];
}

// =====================================================
// Generic Helper Types
// =====================================================

export type TableMeta = {
  isAddToSetMode?: boolean;
  onAddToSet?: (problem: Problem) => void;
  onEdit?: (problem: Problem) => void;
  onDelete?: (problemId: string, problemTitle: string) => void;
};

export type ProblemFormProps = {
  subjectId: string;
  availableTags?: SimpleTag[];
  problem?: Problem | null;
  onCancel?: (() => void) | null;
  onProblemCreated?: ((newProblem: Problem) => void) | null;
  onProblemUpdated?: ((updatedProblem: Problem) => void) | null;
};

export type SubjectFormProps = {
  onSubjectCreated?: (subject: Subject) => void;
};

export type SubjectRowProps = {
  subject: Subject;
  onSubjectDeleted?: (subjectId: string) => void;
  onSubjectUpdated?: (subject: Subject) => void;
  showConfirmation?: (config: ConfirmationConfig) => void;
};

export type TagRowProps = {
  tag: Tag;
  onTagDeleted?: (tagId: string) => void;
  onTagUpdated?: (tag: Tag) => void;
  showConfirmation?: (config: ConfirmationConfig) => void;
};

export type TagFormProps = {
  subjectId: string;
  onTagCreated?: (tag: Tag) => void;
};
