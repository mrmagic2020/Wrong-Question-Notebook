# Missing Database RPC Functions for Statistics Dashboard

## Description

The Statistics page (`/statistics`) fails to load data because the database is missing several RPC (Remote Procedure Call) functions that the frontend code expects.

## Error Message

All statistics RPC calls fail with the same pattern:

```
Statistics RPC get_user_statistics failed: "Could not find the function public.get_user_statistics(p_user_id) in the schema cache"
Statistics RPC get_study_streaks failed: "Could not find the function public.get_study_streaks(p_user_id, p_user_tz) in the schema cache"
Statistics RPC get_session_statistics failed: "Could not find the function public.get_session_statistics(p_user_id) in the schema cache"
Statistics RPC get_subject_breakdown failed: "Could not find the function public.get_subject_breakdown(p_user_id) in the schema cache"
Statistics RPC get_weekly_progress failed: "Could not find the function public.get_weekly_progress(p_user_id, p_user_tz) in the schema cache"
Statistics RPC get_activity_heatmap failed: "Could not find the function public.get_activity_heatmap(p_user_id, p_user_tz) in the schema cache"
Statistics RPC get_recent_study_activity failed: "Could not find the function public.get_recent_study_activity(p_user_id) in the schema cache"
```

## Affected Files

**Frontend:**
- `web/app/(app)/statistics/page.tsx` (original)
- `web/app/[locale]/(app)/statistics/page.tsx` (i18n version)

**Database:**
- `supabase/migrations/20260405100000_initial_schema.sql` (only 3 functions defined: `get_subjects_with_metadata`, `update_updated_at_column`, `handle_new_user`)

## Expected Behavior

The Statistics Dashboard should display:
- User overview statistics (total problems, mastered, needs review, wrong counts)
- Study streaks (current and longest streak)
- Session statistics (total sessions, average duration, average problems per session)
- Subject breakdown (per-notebook problem counts)
- Weekly progress data
- Activity heatmap (GitHub-style contribution graph)
- Recent study activity feed

## Steps to Reproduce

1. Log in to the application
2. Navigate to the Statistics page (`/statistics` or `/zh-CN/statistics`)
3. Open browser console
4. Observe multiple error logs from `Statistics RPC XXXX failed`

## Impact

- Statistics Dashboard is non-functional
- Users cannot view their study progress, streaks, or activity data
- All 7 RPC calls fail, leaving the dashboard with empty/default data

## Suggested Fix

Create a new migration file (`supabase/migrations/TIMESTAMP_statistics_functions.sql`) with the following functions:

1. **`get_user_statistics(p_user_id UUID)`** - Returns overview counts (total, mastered, needs_review, wrong)
2. **`get_study_streaks(p_user_id UUID, p_user_tz TEXT)`** - Returns current and longest streak
3. **`get_session_statistics(p_user_id UUID)`** - Returns session aggregations
4. **`get_subject_breakdown(p_user_id UUID)`** - Returns per-subject problem counts
5. **`get_weekly_progress(p_user_id UUID, p_user_tz TEXT)`** - Returns weekly mastery data
6. **`get_activity_heatmap(p_user_id UUID, p_user_tz TEXT)`** - Returns activity day data
7. **`get_recent_study_activity(p_user_id UUID)`** - Returns recent activity feed

## Additional Context

The frontend code gracefully handles these errors (logs to console, falls back to empty data), so the page renders without crashing. However, all statistics cards show zero values until the missing functions are created.

---

**Related TypeScript types:** `web/lib/types.ts` exports `StatisticsOverview`, `StudyStreaks`, `SessionStatistics`, `SubjectBreakdownRow`, `WeeklyProgressPoint`, `ActivityDay`, `RecentStudyActivity`
