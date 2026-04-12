<p align="center">
  <img src="web/public/W_logo.svg" alt="Wrong Question Notebook" width="120">
</p>

<h1 align="center">Wrong Question Notebook</h1>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a>
</p>

The Wrong Question Notebook (WQN) is a web application designed to help students systematically track, organise, and revise the problems they answered incorrectly. It provides a comprehensive system for managing problems across multiple notebooks, tracking progress with detailed statistics, and facilitating effective revision through structured review sessions.

**Live:** [wqn.magicworks.app](https://wqn.magicworks.app/)

## Features

### Notebook & Problem Management

- Create colour-coded notebooks (formerly "subjects") with custom icons to organise problems
- **Three problem types**: Multiple Choice (MCQ), Short Answer, and Extended Response
- **Rich text editor** (TipTap) with formatting, LaTeX math equations, tables, lists, images, and more
- **Enhanced answer config**: MCQ radio-button picker, multi-answer short text, numeric answers with tolerance
- **Auto-marking**: Automatic answer validation for supported problem types
- **Status tracking**: Mark problems as Wrong, Needs Review, or Mastered
- **File attachments**: Upload images and PDFs as problem assets or solution assets
- Sortable and filterable problem tables with faceted search

### Tag System

- Create and manage tags within notebooks
- Tag problems with multiple tags for flexible categorisation
- Filter problems by tags
- Global tag overview across all notebooks

### Problem Sets & Review Sessions

- Create manual or **Smart Sets** (auto-populated via saved filter configs)
- **Sharing levels**: Private, Limited (share with specific users via email), or Public
- **Session-based review**: Start, pause, and resume review sessions
- Per-problem answer submission with auto-marking or self-assessment
- **Session summary**: Post-review statistics and breakdown
- Solution reveal after attempting problems

### Discovery & Social

- **Public Discovery page** (`/discover`) with PostgreSQL full-text search (tsvector + GIN), subject category filters, quality-biased ranking refreshed by `pg_cron`, and cursor-based infinite scroll
- **Social engagement** on public problem sets: bounce-filtered view tracking, likes, favourites, copy counts, and a report / flag mechanism for moderation
- **Creator profiles** at `/creators/[username]` with avatar, bio, aggregate engagement stats, and a grid of listed sets
- **Listed / unlisted toggle** with a subject category picker — opt into Discovery only when a set is ready to share
- **Favourites tab** on the problem sets page for quick access to saved sets
- **Username-based identity**: usernames are auto-generated from email and editable from the profile sheet
- **SEO**: dynamic `app/sitemap.ts` covering listed public sets and creator profiles, plus OpenGraph, Twitter Card, and JSON-LD metadata on public set pages

### Statistics Dashboard

- GitHub-style **activity heatmap**
- **Status doughnut chart**: Wrong / Needs Review / Mastered breakdown
- **Progress line chart**: Cumulative mastery over time
- **Subject bar & radar charts**: Per-notebook comparisons
- Hero stat cards (streaks, totals, session stats)
- Recent activity feed

### AI Problem Extraction

- Extract problems from images using **Google Gemini 2.5 Flash**
- Daily usage quota with per-user admin overrides
- Supports auto-detection of problem type, choices, and correct answers

### User Profile

- Customisable profile (avatar, username, bio, demographics)

### Authentication & Security

- Email-based signup and login with **Cloudflare Turnstile** CAPTCHA
- Password reset flow with email confirmation
- Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- HTML sanitisation (DOMPurify + sanitize-html) with math content support
- Rate limiting on sensitive endpoints
- Request validation with Zod schemas

### Privacy & Compliance

- **GDPR-compliant cookie consent** banner with granular preferences
- Privacy Policy page

## Tech Stack

| Layer          | Technology                                       |
| -------------- | ------------------------------------------------ |
| Framework      | Next.js 16 (App Router, Turbopack)               |
| Language       | TypeScript (strict)                              |
| Styling        | Tailwind CSS 3, tailwindcss-animate              |
| Components     | shadcn/ui (Radix UI + CVA)                       |
| Rich text      | TipTap (math, tables, images, links, typography) |
| Math rendering | KaTeX                                            |
| Auth & DB      | Supabase (PostgreSQL, Auth, Storage)             |
| AI             | Google Gemini 2.5 Flash (@google/genai)          |
| CAPTCHA        | Cloudflare Turnstile                             |
| Charts         | Chart.js + react-chartjs-2                       |
| Data tables    | TanStack Table                                   |
| Validation     | Zod                                              |
| Theme          | next-themes (class strategy)                     |
| Analytics      | Vercel Analytics + Speed Insights                |
| Deployment     | Vercel                                           |
| Testing        | Vitest + @vitest/coverage-v8                     |
| Code quality   | ESLint, Prettier                                 |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- (Optional) A [Gemini API key](https://aistudio.google.com/) for AI problem extraction
- (Optional) A [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) site key

### Installation

```bash
git clone https://github.com/mrmagic2020/Wrong-Question-Notebook.git
cd Wrong-Question-Notebook/web
npm install
```

### Environment Variables

Copy the example and fill in your values:

```bash
cp env.example .env.local
```

| Variable                                       | Description                               | Required |
| ---------------------------------------------- | ----------------------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Supabase project URL                      | Yes      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Supabase anon / public key                | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`                    | Supabase service role key (server-side)   | Yes      |
| `SITE_URL`                                     | Deployed site URL (for sitemap)           | No       |
| `GEMINI_API_KEY`                               | Google Gemini API key (for AI extraction) | No       |

### Development

```bash
npm run dev
```

### Available Scripts

Run from `web/`:

| Command              | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `npm run dev`        | Start dev server (Turbopack)                                     |
| `npm run build`      | Production build                                                 |
| `npm run type-check` | TypeScript check (`tsc --noEmit`)                                |
| `npm run lint`       | ESLint check                                                     |
| `npm run test`       | Run tests (Vitest)                                               |
| `npm run test:watch` | Run tests in watch mode                                          |
| `npm run fix-all`    | Auto-fix lint + format                                           |
| `npm run prepush`    | Full check: fix-all, type-check, lint, format-check, test, build |

Always run `npm run prepush` before committing.

## Project Structure

```t
web/
  app/
    [locale]/
      (app)/          # Authenticated pages (notebooks, problems, problem-sets,
                      #   discover, creators, statistics, insights, admin)
      auth/           # Auth pages (login, sign-up, forgot-password, etc.)
      privacy/        # Privacy Policy page
      page.tsx        # Public landing page
    api/              # API route handlers (incl. /discover, social endpoints)
    sitemap.ts        # Dynamic sitemap (listed public sets + creator profiles)
    layout.tsx        # Root layout (title.template for localised <title>)
    globals.css       # Global styles, CSS utilities, animations
  components/
    ui/               # shadcn/ui primitives
    landing/          # Landing page components
    subjects/         # Notebook cards and dialogs
    review/           # Review session components
    statistics/       # Dashboard charts and cards
    admin/            # Admin panel components
    cookie-consent/   # GDPR consent banner and provider
    discovery-card.tsx
    social-actions-bar.tsx
    report-dialog.tsx
    ...               # Other feature components
  lib/                # Utilities, Supabase clients, schemas, types, constants
  messages/           # i18n message bundles (en, zh-CN)
  public/             # Static assets (W_logo.svg, robots.txt)
  middleware.ts       # Supabase session refresh
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for a detailed Vercel deployment guide.

## Documentation

- [CHANGELOG.md](CHANGELOG.md) -- Version history
- [DEPLOYMENT.md](DEPLOYMENT.md) -- Deployment guide
- [Proposal.md](Proposal.md) -- Initial project proposal

## Contributing

This project uses ESLint, Prettier, and TypeScript for code quality. Please run the following before pushing:

```bash
npm run prepush
```

## License

This project is licensed under the GPL-3.0 license. See [LICENSE](LICENSE) for details.
