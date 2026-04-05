// Centralized type definitions for the Wong Question Notebook application
// This file contains all application types to eliminate redundancy and improve type safety

import { ProblemType, ProblemStatus, ProblemSetSharingLevel } from './schemas';
import type { ErrorBroadCategory } from './constants';
import { ColumnDef } from '@tanstack/react-table';

// =====================================================
// Core Entity Types (from database)
// =====================================================

export interface Subject {
  id: string;
  name: string;
  color?: string;
  icon?: string;
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
  answer_config?: AnswerConfig | null;
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

export interface FilterConfig {
  tag_ids: string[];
  statuses: ProblemStatus[];
  problem_types: ProblemType[];
  days_since_review: number | null;
  include_never_reviewed: boolean;
}

export interface SessionConfig {
  randomize: boolean;
  session_size: number | null;
  auto_advance: boolean;
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
  is_smart: boolean;
  filter_config?: FilterConfig | null;
  session_config?: SessionConfig | null;
  allow_copying: boolean;
  is_listed: boolean;
  discovery_subject: string | null;
}

// =====================================================
// Social / Discovery Types
// =====================================================

export interface ProblemSetStats {
  view_count: number;
  unique_view_count: number;
  like_count: number;
  copy_count: number;
  problem_count: number;
  ranking_score: number;
}

export interface ProblemSetCard {
  id: string;
  name: string;
  description: string | null;
  subject_name: string;
  subject_color: string | null;
  subject_icon: string | null;
  problem_count: number;
  is_smart: boolean;
  owner: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  stats: ProblemSetStats;
  created_at: string;
}

export interface UserSocialState {
  liked: boolean;
  favourited: boolean;
}

export interface ProblemSetReport {
  id: string;
  problem_set_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
}

export interface OwnerProfile {
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  gender: string | null;
}

export interface ReviewSessionState {
  id: string;
  user_id: string;
  problem_set_id: string | null;
  session_type?: 'normal' | 'spaced_repetition';
  subject_id?: string | null;
  started_at: string;
  last_activity_at: string;
  is_active: boolean;
  session_state: {
    problem_ids: string[];
    current_index: number;
    completed_problem_ids: string[];
    skipped_problem_ids: string[];
    initial_statuses: Record<string, ProblemStatus>;
    elapsed_ms: number;
  };
}

export interface ReviewSessionResult {
  id: string;
  session_state_id: string;
  problem_id: string;
  completed_at: string;
  was_correct: boolean | null;
  was_skipped: boolean;
}

export interface ReviewSessionSummary {
  total_problems: number;
  completed_count: number;
  skipped_count: number;
  status_counts: { mastered: number; needs_review: number; wrong: number };
  status_deltas: { mastered: number; needs_review: number; wrong: number };
  elapsed_ms: number;
  started_at: string;
  completed_at: string | null;
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
  cause: string | null;
  is_self_assessed: boolean;
  confidence: number | null;
  reflection_notes: string | null;
  selected_status: ProblemStatus | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Answer Configuration Types
// =====================================================

export interface MCQChoice {
  id: string;
  text: string;
}

export interface MCQAnswerConfig {
  type: 'mcq';
  choices: MCQChoice[];
  correct_choice_id: string;
  randomize_choices?: boolean;
}

export interface ShortAnswerTextConfig {
  type: 'short';
  mode: 'text';
  acceptable_answers: string[];
}

export interface ShortAnswerNumericConfig {
  type: 'short';
  mode: 'numeric';
  numeric_config: {
    correct_value: number;
    tolerance: number;
    unit?: string;
  };
}

export type AnswerConfig =
  | MCQAnswerConfig
  | ShortAnswerTextConfig
  | ShortAnswerNumericConfig;

// =====================================================
// Extended/Computed Types (for UI)
// =====================================================

export interface SubjectWithMetadata extends Subject {
  problem_count?: number;
  last_activity?: string;
  due_count?: number;
}

export interface ReviewSchedule {
  id: string;
  user_id: string;
  problem_id: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetition_number: number;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
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
// AI Extraction Types
// =====================================================

export interface ExtractionConfidence {
  problem_type_confidence: 'high' | 'medium' | 'low';
  content_quality: 'clear' | 'partially_unclear' | 'unclear';
  has_math: boolean;
  warnings?: string[];
}

export interface SuggestedTags {
  existing: { id: string; name: string }[];
  new: { name: string }[];
}

export interface AnswerHint {
  mcq_correct_choice_id?: string | null;
  short_answer_value?: string | null;
  short_answer_is_numeric?: boolean | null;
  extended_working?: string | null;
  answer_confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedProblemData {
  problem_type: 'mcq' | 'short' | 'extended';
  title: string;
  content: string; // raw text with $...$ and $$...$$ math delimiters
  mcq_choices?: { id: string; text: string }[];
  suggest_image_asset: boolean;
  confidence: ExtractionConfidence;
  suggested_tags?: SuggestedTags;
  answer_hint?: AnswerHint | null;
}

// =====================================================
// Onboarding Types
// =====================================================

export interface OnboardingStatus {
  hasSubject: boolean;
  hasProblem: boolean;
  hasReviewed: boolean;
  firstSubjectId: string | null;
  firstProblemId: string | null;
  firstProblemSubjectId: string | null;
}

// =====================================================
// QR Upload Session Types
// =====================================================

export type QRSessionStatus = 'pending' | 'uploaded' | 'consumed' | 'expired';

export interface QRUploadSession {
  id: string;
  user_id: string;
  token_hash: string;
  status: QRSessionStatus;
  file_path: string | null;
  mime_type: string | null;
  created_at: string;
  expires_at: string;
  uploaded_at: string | null;
  consumed_at: string | null;
}

export interface QRSessionCreateResponse {
  sessionId: string;
  token: string;
  expiresAt: string;
  uploadUrl: string;
}

export interface QRSessionStatusResponse {
  status: QRSessionStatus;
  filePath: string | null;
  mimeType: string | null;
}

export interface QRSessionConsumeResponse {
  filePath: string;
  mimeType: string;
}

// =====================================================
// Error Categorisation & Insights Types
// =====================================================

// ErrorBroadCategory is the single source of truth in constants.ts (derived from ERROR_CATEGORY_VALUES).
// Re-exported here so consumers can import from either location.
export type { ErrorBroadCategory } from './constants';

export interface ErrorCategorisation {
  id: string;
  attempt_id: string;
  problem_id: string;
  subject_id: string;
  user_id: string;
  broad_category: ErrorBroadCategory;
  granular_tag: string;
  topic_label: string;
  topic_label_normalised: string;
  ai_confidence: number;
  ai_reasoning: string | null;
  is_user_override: boolean;
  original_broad_category: ErrorBroadCategory | null;
  original_granular_tag: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeakSpot {
  topic_label: string;
  subject_id: string;
  subject_name: string;
  subject_color?: string;
  problem_count: number;
  trend_phrase: string;
  dominant_error_type: string;
  problem_ids: string[];
}

export interface TopicCluster {
  label: string;
  problem_count: number;
  wrong_count: number;
  needs_review_count: number;
  mastered_count: number;
  narrative: string;
  problem_ids: string[];
}

export type DigestStatus = 'generating' | 'completed' | 'failed';

export type DigestTier = 'full' | 'mastery' | 'narrow';

export interface InsightDigest {
  id: string;
  user_id: string;
  generated_at: string;
  status: DigestStatus;
  headline: string;
  error_pattern_summary: string;
  subject_error_patterns?: Record<string, string>;
  subject_health: Record<string, string>;
  weak_spots: WeakSpot[];
  topic_clusters: Record<string, TopicCluster[]>;
  progress_narratives: Record<string, string>;
  raw_aggregation_data?: Record<string, unknown>;
  digest_tier?: DigestTier;
}

export interface ErrorAggregationRow {
  categorisation_id: string;
  attempt_id: string;
  problem_id: string;
  subject_id: string;
  subject_name: string;
  broad_category: ErrorBroadCategory;
  granular_tag: string;
  topic_label: string;
  topic_label_normalised: string;
  ai_confidence: number;
  is_user_override: boolean;
  problem_status: string;
  problem_title: string;
  attempt_created_at: string;
  categorisation_created_at: string;
  attempt_selected_status: string;
}

export interface UncategorisedAttempt {
  attempt_id: string;
  problem_id: string;
  subject_id: string;
  submitted_answer: unknown;
  is_correct: boolean | null;
  cause: string | null;
  reflection_notes: string | null;
  selected_status: string;
  attempt_created_at: string;
  problem_title: string;
  problem_content: string | null;
  problem_type: string;
  correct_answer: string | null;
  subject_name: string;
}

export interface ActivitySummary {
  total_problems: number;
  total_attempts: number;
  total_subjects: number;
  problems_with_errors: number;
}

export interface InsufficientDataResult {
  insufficient_data: true;
  activity: ActivitySummary;
  activity_needed: number;
  errors_needed: number;
}

// =====================================================
// Component Prop Types
// =====================================================

export type TagFilterMode = 'any' | 'all';

export interface SearchFilters {
  searchText: string;
  problemTypes: ProblemType[];
  statuses: ProblemStatus[];
  tagIds: string[];
  tagFilterMode: TagFilterMode;
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
  getRowHref?: (problem: Problem) => string;
  availableTags?: SimpleTag[];
  onTableReady?: (table: any) => void;
  onSelectionChange?: (selectedProblems: Problem[]) => void;
  resetSelection?: boolean;
  onColumnVisibilityChange?: () => void;
  columnVisibilityStorageKey?: string;
  isAddToSetMode?: boolean;
  hideStatusStrip?: boolean;
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
  answerConfig?: AnswerConfig | null;
  problemType?: string;
  isRevealed: boolean;
  onToggle: () => void;
  wrapperClassName?: string;
}

export interface AssetPreviewProps {
  asset: Asset;
}

export interface AnswerInputProps {
  problemType: ProblemType;
  correctAnswer?: any;
  answerConfig?: AnswerConfig | null;
  value: any;
  onChange: (value: any) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  hideChoiceIds?: boolean;
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
    allow_copying?: boolean;
    is_listed?: boolean;
    discovery_subject?: string | null;
    problem_count?: number;
  };
  hasUsername?: boolean;
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
  statsMap?: Record<
    string,
    { view_count: number; like_count: number; copy_count: number }
  >;
  hasUsername?: boolean;
}

export interface ProblemSetPageClientProps {
  initialProblemSet: ProblemSetWithDetails & {
    problems: ProblemInSet[];
  };
  isAuthenticated?: boolean;
  ownerProfile?: OwnerProfile | null;
  initialStats?: ProblemSetStats | null;
  initialSocialState?: UserSocialState | null;
  hasUsername?: boolean;
  backHref?: string;
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
  alwaysExpanded?: boolean;
  initialShowImageScan?: boolean;
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

// =====================================================
// Statistics Dashboard Types
// =====================================================

export interface StatisticsOverview {
  total_problems: number;
  mastered_count: number;
  needs_review_count: number;
  wrong_count: number;
  mastery_rate: number;
}

export interface StudyStreaks {
  current_streak: number;
  longest_streak: number;
}

export interface SessionStatistics {
  total_sessions: number;
  avg_duration_ms: number;
  avg_problems_per_session: number;
  total_review_time_ms: number;
}

export interface SubjectBreakdownRow {
  subject_id: string;
  subject_name: string;
  total: number;
  mastered: number;
  needs_review: number;
  wrong: number;
  mastery_pct: number;
}

export interface WeeklyProgressPoint {
  week_start: string;
  cumulative_mastered: number;
}

export interface ActivityDay {
  activity_date: string;
  activity_count: number;
}

export interface RecentStudyActivity {
  problem_id: string;
  problem_title: string;
  subject_name: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
}

export interface StatisticsData {
  overview: StatisticsOverview;
  streaks: StudyStreaks;
  sessionStats: SessionStatistics;
  subjectBreakdown: SubjectBreakdownRow[];
  weeklyProgress: WeeklyProgressPoint[];
  activityHeatmap: ActivityDay[];
  recentActivity: RecentStudyActivity[];
  timezone: string;
}
