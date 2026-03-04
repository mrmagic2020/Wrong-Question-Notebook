# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog],
and this project adheres to [Semantic Versioning].

## [Unreleased]

### Added

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
