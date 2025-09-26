# Project Proposal: Wrong-Question Notebook Web Application

## 1. Overview

The **Wrong-Question Notebook (WQN)** is a web-based application designed to help students systematically track, organise, and revise the problems they answered incorrectly. Unlike traditional error logs, WQN supports **multi-subject problem banks**, **custom knowledge tags**, **smart filtering**, and **AI-powered review sessions**.

## 2. Objectives

* Provide students with a **structured problem base** for each subject.
* Allow fine-grained **tagging of mistakes by concept/knowledge area**.
* Enable **smart revision sessions** where students can filter by tags, subjects, or error frequency.
* Offer **analytics dashboards** to highlight weak spots and improvement trends.
* Support **AI/LLM-powered assistance** (optional), e.g. suggesting tags, generating similar practice problems, or guiding reflection on mistakes.

## 3. Core Functionalities

### 3.1 User Features

* **Account system** (email/password, Google login, etc.).
* **Subject problem banks** – each subject has its own collection of questions.
* **Add problems manually** (text, LaTeX support, image/PDF upload with optional OCR).
* **Problem type selection** – when adding problems, students can:

  * Choose a **problem type** (e.g. multiple choice, fill-the-gap, short answer, extended response).
  * Optionally provide a **correct answer** (e.g. MC choice, numerical value, string, model answer).
  * Decide whether the system should **auto-mark** the problem during revision (auto-check vs manual review).
* **Tagging system** – users can assign multiple tags (knowledge areas, exam sections, etc.) to a problem.
* **Wrong-question logging** – mark problems as “wrong”, “needs review”, or “mastered”.
* **Filtering & search** – select problems by subject, tag, status, or time range.
* **Review mode** – system presents logged wrong questions, either in random order or filtered by tag/weakness.
* **Analytics dashboard** – visual breakdown of mistakes by tag, subject, frequency, and progress over time.
* **Spaced repetition scheduling** – resurfacing wrong questions at optimal intervals (similar to Anki).

### 3.2 AI/LLM-powered Extensions

* **Automatic tag suggestion** based on question content.
* **AI tutor mode** – explain solutions, highlight common mistakes, or generate hints.
* **Practice problem generation** – create new problems targeting the same tags/knowledge gaps.
* **Reflection prompts** – encourage students to write why they got it wrong (e.g., “misread question,” “formula error”).

### 3.3 Teacher / Collaboration Features (Phase 2)

* Shared problem banks (teacher-to-student).
* Class dashboards (aggregate student mistake trends).
* Peer sharing of wrong-question notebooks.

## 4. Workflows

### 4.1 Student Workflow

1. Student logs into WQN.
2. Opens subject → clicks “Add Problem.”
3. Uploads text/image/PDF or types question → assigns tags.
4. Selects **problem type**, optionally provides correct answer, and chooses auto-marking option.
5. Marks problem as wrong / review needed.
6. Later, selects **Review Session** → chooses subject/tags.
7. Solves problems, system auto-marks (if enabled), and student updates status.
8. Analytics update automatically.

### 4.2 Teacher Workflow (future feature)

1. Teacher creates subject bank → shares with class.
2. Students solve → system auto-logs mistakes.
3. Teacher views aggregated analytics → adjusts teaching focus.

## 5. Technology Stack — Provider Decisions

### 5.1 Frontend

* **Framework:** Next.js (React).
* **Hosting/CDN:** **Vercel** – first-class Next.js support, global edge network (with APAC POPs), instant preview builds.

### 5.2 Backend

* **Runtime:** **Vercel Serverless Functions** (for lightweight API routes) + **Supabase Edge Functions** (for DB-adjacent logic and scheduled tasks).
* **Justification:** Seamless integration, minimal ops, fast developer iteration.

### 5.3 Database

* **Database:** **Supabase Postgres (ap-southeast-2)**.
* **Why:** Managed Postgres with **Row-Level Security**, **pgvector** for semantic search, and local Sydney region for low latency.

### 5.4 Authentication

* **Auth provider:** **Supabase Auth**.
* **Why:** Works seamlessly with Postgres and RLS policies, supports email/password + OAuth logins.

### 5.5 Storage

* **File storage:** **Supabase Storage**.
* **Why:** S3-compatible, built-in policies, integrated with auth for per-user buckets.

### 5.6 Search

* **Initial:** Postgres Full-Text Search.
* **Scaling path:** Move to **Typesense** if advanced ranking/performance is needed.

### 5.7 Caching / Rate-Limiting

* **Service:** **Upstash Redis**.
* **Why:** Serverless, usage-based pricing, ideal for sessions, queues, and throttling.

### 5.8 OCR

* **Primary:** **Google Cloud Vision API**.
* **Optional (maths-heavy):** **Mathpix** for LaTeX equation recognition.

### 5.9 AI/LLM

* **Primary provider:** **OpenAI GPT-4.x family**.
* **Fallback/abstraction:** Support for Anthropic Claude or local LLMs.
* **Use cases:** Tag suggestion, solution hints, practice question generation.

### 5.10 Embeddings & Vector Store

* **Embedding model:** **OpenAI text-embedding-3-small**.
* **Storage:** **pgvector in Supabase Postgres**.

### 5.11 Analytics

* **Product analytics:** **PostHog** (hosted).
* **Why:** Event tracking, funnels, retention, and feature flags in one tool.

### 5.12 Error Monitoring

* **Service:** **Sentry**.
* **Why:** Unified FE/BE error tracking, performance tracing, great developer tooling.

### 5.13 Email

* **Provider:** **Resend**.
* **Why:** Modern API, simple setup, great developer UX.

### 5.14 CI/CD

* **Primary:** **GitHub Actions** for lint/tests/build.
* **Deploys:** Vercel handles previews & production.

### 5.15 Payments (future)

* **Provider:** **Stripe**.
* **Why:** Best-in-class for subscriptions, global coverage, developer-friendly.

## 6. Development Roadmap

### Phase 1 – MVP (3 months)

* Core CRUD for questions, subjects, tags.
* Problem types + optional answers + auto-marking.
* Wrong-question marking & filtering.
* Basic review mode.
* Simple analytics dashboard.
* Authentication & storage.

### Phase 2 – Smart Features (3–6 months)

* Spaced repetition scheduling.
* AI-powered tag suggestion & hints.
* OCR for images/PDFs.
* Enhanced analytics (progress tracking).

### Phase 3 – Collaboration & Scaling

* Teacher dashboards.
* Class-sharing features.
* API integrations with LMS (Canvas, Google Classroom).
* Mobile app (React Native / Expo).

## 7. Risks & Considerations

* **Data privacy:** Must comply with GDPR/FERPA; encrypt data in transit and at rest.
* **AI reliability:** LLMs may hallucinate; disclaimers and human override required.
* **Adoption curve:** Many students/teachers use Excel/Notion; UX must feel faster and more valuable.
* **Scalability:** Plan for >10k problems per user with efficient tag queries and search indexing.

## 8. Success Metrics

* Weekly active students logging problems.
* Review session completion rates.
* Decrease in repeated mistakes per user.
* Teacher/classroom adoption in Phase 2.
