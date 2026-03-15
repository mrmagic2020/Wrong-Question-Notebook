# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog],
and this project adheres to [Semantic Versioning].

## [Unreleased]

### Added

- **Weak Spots & Insights Dashboard**
  - New `/insights` route with AI-generated narrative study briefings
  - Per-attempt AI error categorisation (runs automatically after wrong/needs_review attempts)
  - 7 broad error categories: conceptual, procedural, knowledge gap, misread, careless, time pressure, incomplete
  - AI-generated topic clustering for grouping related problems
  - Cross-subject overview with ranked weak spots, error pattern summary, and subject health assessments
  - Per-subject deep dive with topic cluster map, mastery status bars, and progress narratives
  - "Review these problems" integration: start targeted review sessions from any weak spot or topic cluster
  - Error category badges inline on attempt timeline with user override support
  - Daily digest cron job (19:00 UTC) for pre-computing insights
  - New database tables: `error_categorisations`, `insight_digests`
  - **Tiered insight generation**: multi-dimensional threshold replaces single error-count gate
    - "Full" digest when ≥5 attempted problems and ≥3 with errors (existing behavior)
    - "Mastery" digest when ≥5 attempted problems but <3 errors — celebrates accuracy instead of requiring failures
    - "Narrow" (preliminary) digest when <5 problems but ≥3 errors — provides early analysis with limited-data caveat
    - Progress bars showing how close the user is to unlocking insights when data is insufficient
    - Tier badges ("Preliminary", "Mastery") on digest headers

- **Add to Notebook**: Copy individual problems from shared problem sets to your own notebooks
  - Available in problem row actions and on the review page
  - Select target subject and optionally copy tags

- **Problem Set Page Overhaul**
  - Full-featured data table with search, filtering (type/tags/status), sorting, and pagination replaces the primitive problem list
  - Mobile card list view with responsive filter toolbar for problem sets
  - Smart filter criteria display with structured layout, colored status badges, and icons
  - Owner profile card with hover popover (avatar, display name, bio, gender) for shared problem sets
  - "Copy to My Library" deep-copy feature: duplicate problems + set into user's account with subject picker and optional tag copying
  - `allow_copying` toggle per problem set (default: true) in creation and edit dialogs
  - Owner-only progress stats (total/wrong/needs review/mastered); non-owners see simple problem count
  - Viewer-only review sessions: ungated navigation, no assessment form, clean session completion

### Fixed

- **Insights Digest Accuracy**
  - Fixed overcounting in error distribution (now counts per unique problem, not per attempt)
  - Fixed mastered topics incorrectly appearing as weak spots
  - Fixed cluster merge inflating mastered/wrong counts when clusters share problems
  - Added total problem counts per subject for balanced AI assessments (not just errors)

- **Review Session Bug for Non-Owner Users**
  - Fixed Next button permanently disabled in read-only review sessions (form saved callback never fired)
  - Read-only sessions now skip API calls for progress tracking and session completion
  - Session completes cleanly by redirecting back to problem set page

- Fixed DataTable ignoring the `meta` prop, which prevented "Remove from set" action from working in problem set tables

- **Timezone-Aware Day Boundaries**
  - All day-boundary features (streaks, heatmap, weekly progress, quotas, SM-2 same-day guard) now respect the user's configured timezone instead of UTC
  - Auto-detection of browser timezone on every authenticated page load, synced to profile when changed

### Changed

- **Unified Status Selection & Attempt Logging**
  - Merged StatusSelector and ReflectionDialog into a single embedded `AttemptStatusForm` in the review sidebar — every status assessment now creates an attempt record
  - Replaced `is_correct` + `confidence` SR input with three-tier `selected_status` (`wrong`/`needs_review`/`mastered`) mapped directly to SM-2 quality scores (1/3/5)
  - Auto-mark problems pre-select status based on correctness and constrain available options (wrong→Wrong/Needs Review, correct→Needs Review/Mastered)
  - Added `selected_status` column to `attempts` table with backfill migration
  - API routes (`POST /api/attempts`, `PATCH /api/attempts/[id]`) now sync `problems.status` and recalculate review schedule when `selected_status` is provided
  - Timeline entries now show status badges (Wrong/Needs Review/Mastered) instead of Correct/Incorrect; removed confidence dots
  - Session clients (problem-set and spaced review) gate "Next" on form save instead of separate status selection
  - Form state persists across session navigation via `AttemptState` cache with `selectedStatus` and `formSaved` fields

### Removed

- `StatusSelector` component (replaced by `AttemptStatusForm`)
- `ReflectionDialog` component (replaced by `AttemptStatusForm` + `AttemptEditDialog`)
- `ConfidenceSelector` component (confidence removed from UI)
- `SRCorrectnessPrompt` component (replaced by `AttemptStatusForm`)
- `StatusSelectorProps` interface from types
- `mapConfidenceToQuality()` function (replaced by `mapStatusToQuality()`)
- `DEFAULT_CONFIDENCE` constant (no longer needed)

### Added

- **Spaced Repetition System (SM-2)**
  - SM-2 algorithm implementation for intelligent review scheduling (`web/lib/spaced-repetition.ts`)
  - Review schedule automatically updates after each attempt using SM-2 quality derived from `selected_status`
  - New problems get a review schedule on creation; existing problems seeded based on status
  - "Due" badge on notebook cards showing how many problems need review per subject
  - Session size picker dialog (5, 10, 20, or All) before starting a spaced review
  - Full spaced review session flow: review problems, self-assess non-auto-mark problems, complete summary
  - SR status prompt for non-auto-mark problems using the unified attempt status form
  - Database RPCs for efficient due count queries (`get_due_problems_count`, `get_due_problems_for_subject`)
  - Extended `get_subjects_with_metadata` RPC with `due_count` field
  - Review schedule cache invalidation on session completion
  - Comprehensive Vitest unit tests for SM-2 algorithm (24 test cases)

- **Subject Problems Page UX Improvements**
  - Stats strip showing total problems, proportional status bar (wrong/review/mastered), and mastery percentage
  - Empty state with illustration and CTA buttons when no problems exist
  - Floating action button (split pill: Write / Scan) at bottom of viewport for quick problem creation
  - Form opens inline at top of page with slide-in animation, replacing the always-visible card form
  - Confirmation dialog when switching from create to edit mode with unsaved data
  - Table row left-border color accents by status (red/amber/green) and reduced opacity for mastered rows
  - Mobile card list view (below 768px) with status-colored borders, overflow menus, and "Show more" pagination
  - Mobile-responsive search/filter toolbar with popover filters and select mode toggle
  - `useMediaQuery` and `useIsMobile` hooks for responsive layout switching

### Changed

- **Subject Problems Page Layout**
  - Removed the always-visible "Add a problem" card; creation now triggered via FAB or empty state CTAs
  - Edit form state lifted from `EnhancedProblemsTable` to `ProblemsPageClient` for unified form management
  - Responsive page header: title and back link stack vertically on mobile
  - Back link shows "Back" on mobile, "Back to Shelf" on desktop

- **MCQ Choice Randomization During Review**
  - Per-problem "Randomize choices during review" toggle in the MCQ choice editor (on by default)
  - When enabled, review UI shuffles the display order of MCQ choices using Fisher-Yates shuffle
  - Choice IDs (A, B, C, D) are hidden during the first attempt and revealed after submission, preventing positional memorization while keeping attempt history meaningful
  - Backward-compatible: existing problems without the field default to randomization on

- **Client-Side Image Compression for Extraction**
  - Large images (base64 > 4.3 MB) are automatically compressed before sending to the extraction API
  - Prevents Vercel's 4.5 MB serverless payload limit from rejecting uploads
  - Downscales to max 1500px on the longest side and re-encodes as JPEG at 0.8 quality
  - Small images skip compression entirely — no change in behavior

- **QR Code Phone-to-Desktop Upload**
  - Scan a QR code on desktop to open a lightweight mobile capture page
  - Sessions expire after 5 minutes
  - Supabase Realtime detects uploaded images instantly and feeds them into the AI extraction flow
  - QR code generation is on-demand instead of auto-creating on mount

- **Save Extraction Image as Asset**
  - Opt-in toggles in the image scan preview to save the source image as a problem asset, solution asset, or both
  - Image is automatically uploaded and attached to the problem after extraction

- **Attempt History & Self-Reflection**
  - Post-submission reflection dialog for auto-marked problems (confidence, cause category, notes)
  - Only the first submission per session is recorded as an attempt; resubmissions are mark-only
  - "Reflect" button appears after any submission for optional reflection
  - Manual attempt logging for non-auto-marked problems with self-assessment toggle
  - Collapsible attempt history timeline in the review sidebar with smooth animations
  - Expandable timeline entries showing result, confidence dots, cause, and reflection notes
  - Edit reflection data from timeline entries at any time
  - `PATCH /api/attempts/[id]` endpoint for updating reflection data
  - Database migration: `is_self_assessed`, `confidence`, `reflection_notes`, `updated_at` columns on `attempts` table

## [0.1.0-beta] - 2025-09-27

### Added

- **Subject Management**
  - Create, edit, and delete subjects for organizing problems
  - Subject-based navigation and filtering
  - Clean subject management interface

- **Problem Management System**
  - Create problems with three types: Multiple Choice, Short Answer, and Extended Response
  - Rich text content support with HTML formatting
  - Problem status tracking (Wrong, Needs Review, Mastered)
  - Auto-marking capability for multiple choice questions
  - Problem editing and deletion functionality

- **Tag System**
  - Create and manage tags within subjects
  - Tag problems for better organization and filtering
  - Global tag overview across all subjects

- **Problem Review Interface**
  - Interactive problem review with answer submission
  - Support for different answer input types (text, textarea, multiple choice)
  - Automatic answer validation for auto-marked problems
  - Manual review workflow for complex problems
  - Problem navigation (previous/next) within subjects

- **File Upload and Asset Management**
  - Upload images and PDFs as problem assets
  - Secure file storage with user-based access control
  - Asset preview functionality for images and PDFs
  - Solution assets for detailed explanations

- **Solution Management**
  - Add detailed solution text and assets to problems
  - Solution reveal functionality for self-assessment
  - Rich solution content with multimedia support

<!-- Links -->

[keep a changelog]: https://keepachangelog.com/en/1.0.0/
[semantic versioning]: https://semver.org/spec/v2.0.0.html

<!-- Versions -->

[unreleased]: https://github.com/mrmagic2020/Wong-Question-Notebook/compare/v0.1.0-beta...HEAD
[0.1.0-beta]: https://github.com/mrmagic2020/Wong-Question-Notebook/releases/tag/v0.1.0-beta
