# Manual Test Plan: Weak Spots & Insights Dashboard

## Prerequisites

1. **Environment variables** set in `.env.local`:
   - `CATEGORISATION_SECRET` — any random string (e.g. `openssl rand -base64 32`)
   - `CRON_SECRET` — any random string
   - `GEMINI_API_KEY` — already configured
2. **Dev server running**: `npm run dev` from `web/`
3. **Logged-in user** with at least one subject and some problems

---

## Test 1: Navigation

| Step | Action                                 | Expected                                         |
| ---- | -------------------------------------- | ------------------------------------------------ |
| 1.1  | Open the app while logged in           | Nav bar is visible                               |
| 1.2  | Look at the navigation links (desktop) | "Insights" link appears after "Statistics"       |
| 1.3  | Click "Insights"                       | Navigates to `/insights`                         |
| 1.4  | On mobile, tap the hamburger menu      | "Insights" appears with an orange Lightbulb icon |

---

## Test 2: Empty Insights State

| Step | Action                                       | Expected                                          |
| ---- | -------------------------------------------- | ------------------------------------------------- |
| 2.1  | Navigate to `/insights` with no prior digest | Shows empty state with "Generate Insights" button |
| 2.2  | Verify the empty state message               | Warm, encouraging copy — not a blank page         |
| 2.3  | Toggle dark mode                             | All colors have proper `dark:` variants           |

---

## Test 3: AI Error Categorisation (Auto-Trigger)

**Setup**: Have a subject with at least one problem that has a correct answer configured.

| Step | Action                                                                     | Expected                                                                                                                          |
| ---- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 3.1  | Open a problem in review mode                                              | Problem displays normally                                                                                                         |
| 3.2  | Submit a **wrong** answer (or self-assess as "Wrong")                      | Attempt saves successfully, response returns immediately                                                                          |
| 3.3  | Wait 5-10 seconds, then check the dev server logs                          | Should see the Gemini categorisation call happening in the background (or an error if the API key / secret isn't set)             |
| 3.4  | Check Supabase `error_categorisations` table                               | A new row should exist for this attempt with `broad_category`, `granular_tag`, `topic_label`, `ai_confidence`, and `ai_reasoning` |
| 3.5  | Submit a **correct** answer (self-assess as "Mastered") on another problem | No categorisation should be triggered (check logs — no call to categorise-error)                                                  |
| 3.6  | Submit a "Needs Review" assessment                                         | Categorisation **should** be triggered                                                                                            |

---

## Test 4: Error Category Badge in Attempt Timeline

**Setup**: Have a problem with at least one wrong attempt that has been categorised (from Test 3).

| Step | Action                         | Expected                                                                                                                           |
| ---- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 4.1  | Open the problem's review page | Attempt timeline is visible                                                                                                        |
| 4.2  | Expand the attempt timeline    | The wrong/needs_review attempt shows a colored **error category badge** (e.g. "Conceptual", "Procedural") next to the status badge |
| 4.3  | Hover over the badge           | Shows the granular_tag as a tooltip (e.g. "Sign error in chain rule")                                                              |
| 4.4  | Check a "Mastered" attempt     | No error category badge should appear                                                                                              |

---

## Test 5: Error Category Override

**Setup**: Have a categorised attempt visible in the timeline.

| Step | Action                                         | Expected                                                                                                          |
| ---- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 5.1  | Click the error category badge                 | Editor panel opens below the badge with a dropdown and text field                                                 |
| 5.2  | Check the dropdown                             | Pre-filled with the AI's broad_category, contains all 7 options                                                   |
| 5.3  | Check the text field                           | Pre-filled with the AI's granular_tag                                                                             |
| 5.4  | Change the broad_category to a different value | Dropdown updates                                                                                                  |
| 5.5  | Change the granular_tag text                   | Text field updates                                                                                                |
| 5.6  | Click "Save"                                   | Badge updates to reflect the new category; editor closes                                                          |
| 5.7  | Check Supabase `error_categorisations` table   | `is_user_override = true`, `original_broad_category` and `original_granular_tag` contain the AI's original values |
| 5.8  | Click the badge again to re-open the editor    | "Reset to AI suggestion" link should now be visible                                                               |
| 5.9  | Click "Reset to AI suggestion"                 | Badge reverts to the AI's original categorisation                                                                 |
| 5.10 | Check Supabase                                 | `is_user_override = false`, original fields are cleared                                                           |

---

## Test 6: Digest Generation (First Time)

**Setup**: Have at least 5 wrong/needs_review attempts across your problems (more data = richer digest). Some should already be categorised from Test 3; uncategorised ones will be backfilled.

| Step | Action                                       | Expected                                                                                                  |
| ---- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 6.1  | Navigate to `/insights`                      | Shows empty state with "Generate Insights" button                                                         |
| 6.2  | Click "Generate Insights"                    | Loading state appears ("Generating your first study briefing..." with spinner)                            |
| 6.3  | Wait for generation (may take 10-30 seconds) | Page transitions to show the full digest                                                                  |
| 6.4  | Verify the **Digest Header**                 | Shows an AI-generated headline (specific to your data) and "Updated just now" timestamp                   |
| 6.5  | Verify the **Weak Spots** section            | Shows ranked cards with topic labels, subject badges, problem counts, trend phrases, dominant error types |
| 6.6  | Verify weak spots are capped                 | At most 7 shown initially; "Show all" button if more exist                                                |
| 6.7  | Verify the **Error Pattern Summary**         | Narrative paragraph about your error type distribution                                                    |
| 6.8  | Verify the **Subject Overview**              | One row per subject with a one-line health assessment and link arrow                                      |
| 6.9  | Check Supabase `insight_digests` table       | New row with all JSONB fields populated                                                                   |

---

## Test 7: Digest Generation — Insufficient Data

**Setup**: Use a fresh account or one with fewer than 5 wrong/needs_review attempts total.

| Step | Action                                                | Expected                                                        |
| ---- | ----------------------------------------------------- | --------------------------------------------------------------- |
| 7.1  | Navigate to `/insights` and click "Generate Insights" | After processing, shows insufficient data state                 |
| 7.2  | Verify the message                                    | Warm message like "Not enough data to generate insights yet..." |

---

## Test 8: Digest Generation — Cooldown

| Step | Action                                                | Expected                                                                                    |
| ---- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 8.1  | After Test 6, navigate to `/insights` again           | Shows the existing digest (loaded from DB on server render)                                 |
| 8.2  | If there's a "Refresh" or "Generate" button, click it | Should return the cached digest with a message about recent generation, **not** re-generate |

---

## Test 9: Per-Subject Deep Dive

**Setup**: Have a digest generated (from Test 6).

| Step | Action                                                               | Expected                                                                                                      |
| ---- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 9.1  | On `/insights`, click a subject name in the Subject Overview section | Navigates to `/insights/[subjectId]`                                                                          |
| 9.2  | Verify the **Back link**                                             | "Back to Insights" link at the top, navigates back to `/insights`                                             |
| 9.3  | Verify the **Subject header**                                        | Shows subject name with its accent color                                                                      |
| 9.4  | Verify the **Topic Cluster Map**                                     | Cards sorted by weakness (most wrong first), each with: label, mastery bar, stats, narrative, "Review" button |
| 9.5  | Verify the **Mastery Status Bar**                                    | Horizontal bar with red/amber/green segments proportional to wrong/needs_review/mastered counts               |
| 9.6  | Verify the **Progress Narrative** (if data is sufficient)            | Paragraph about performance trends over time                                                                  |
| 9.7  | Navigate to a subject with no data in the digest                     | Shows appropriate empty state                                                                                 |

---

## Test 10: "Review These Problems" Integration

**Setup**: Have a digest with weak spots containing multiple problems.

| Step | Action                                                                        | Expected                                                                          |
| ---- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 10.1 | On `/insights`, find a weak spot card                                         | "Review" button should be visible                                                 |
| 10.2 | Click "Review" on a weak spot                                                 | Brief loading, then navigates to `/subjects/[subjectId]/review-due?sessionId=...` |
| 10.3 | Verify the review session loads                                               | Shows the correct problems from the weak spot (not random SR problems)            |
| 10.4 | Review a problem (assess as Wrong/Needs Review/Mastered)                      | Normal review flow works — attempt is saved, SR schedule updates                  |
| 10.5 | Complete the review session                                                   | Summary page shows correctly; navigated back or session ends                      |
| 10.6 | On `/insights/[subjectId]`, click "Review this topic" on a topic cluster card | Same flow — creates session with that cluster's problems, navigates to review     |
| 10.7 | Check Supabase `review_session_state` table                                   | New row with `session_type = 'insights_review'`                                   |

---

## Test 11: Cron Endpoint

| Step | Action                                                                                                                       | Expected                                                            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 11.1 | Call without auth: `curl http://localhost:3000/api/cron/generate-digests`                                                    | Returns 401 Unauthorized                                            |
| 11.2 | Call with wrong secret: `curl -H "Authorization: Bearer wrong" http://localhost:3000/api/cron/generate-digests`              | Returns 401                                                         |
| 11.3 | Call with correct secret: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/generate-digests` | Returns 200 with `{ processed, failed, skipped, total_candidates }` |
| 11.4 | Call again immediately                                                                                                       | Should skip all users (no new attempts since last digest)           |

---

## Test 12: Dark Mode

| Step | Action                                       | Expected                                                 |
| ---- | -------------------------------------------- | -------------------------------------------------------- |
| 12.1 | Toggle to dark mode on `/insights`           | All backgrounds, text, borders, badges use dark variants |
| 12.2 | Check `/insights/[subjectId]` in dark mode   | Same — no white-on-white or invisible elements           |
| 12.3 | Check the error category badge in dark mode  | Colored backgrounds use dark variants                    |
| 12.4 | Check the error category editor in dark mode | Dropdown and input fields are styled correctly           |

---

## Test 13: Edge Cases

| Step | Action                                                             | Expected                                                            |
| ---- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 13.1 | Access `/insights` while logged out                                | Redirects to `/auth/login?redirect=/insights`                       |
| 13.2 | Access `/insights/nonexistent-uuid`                                | Returns 404 page                                                    |
| 13.3 | Access `/insights/[subjectId]` for a subject you don't own         | Returns 404                                                         |
| 13.4 | Delete a problem that was in a weak spot, then refresh `/insights` | Page renders without crashing (problem just won't appear in review) |
| 13.5 | User with problems in only one subject visits `/insights`          | Cross-subject overview still works, shows one subject               |

---

## Test 14: Mobile Responsiveness

| Step | Action                                         | Expected                                                              |
| ---- | ---------------------------------------------- | --------------------------------------------------------------------- |
| 14.1 | Open `/insights` on a narrow viewport (~375px) | Layout adapts — cards stack vertically, text doesn't overflow         |
| 14.2 | Weak spot cards                                | Readable, buttons tappable                                            |
| 14.3 | Topic cluster cards on subject page            | Stack vertically, mastery bar scales properly                         |
| 14.4 | Error category editor in timeline              | Usable on mobile — dropdown opens correctly, text field is accessible |

---

## Quick Smoke Test (5 minutes)

If you just want a fast sanity check:

1. Set env vars, start dev server
2. Log a wrong answer on any problem
3. Wait 10 seconds, expand the attempt timeline — look for the colored category badge
4. Navigate to `/insights`, click "Generate Insights"
5. Once the digest appears, click "Review" on a weak spot
6. Verify the review session loads with the right problems
7. Toggle dark mode on the insights page — check nothing is broken
