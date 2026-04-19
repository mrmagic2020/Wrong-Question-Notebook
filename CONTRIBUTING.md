# Contributing to Wrong Question Notebook

Thank you for your interest in contributing to WQN! This guide covers everything you need to set up a local development environment and start working on the project.

## Prerequisites

| Tool                                                              | Version           | Purpose                                        |
| ----------------------------------------------------------------- | ----------------- | ---------------------------------------------- |
| [Node.js](https://nodejs.org/)                                    | 24+               | Runtime                                        |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest            | Local Supabase stack (Postgres, Auth, Storage) |
| npm                                                               | Bundled with Node | Package manager                                |

> **Windows note:** Docker Desktop must be running before you start the local Supabase stack. The Analytics container requires the Docker daemon exposed on `tcp://localhost:2375` — this is optional and everything else works without it.

## Local Development Setup

### 1. Clone and install

```bash
git clone https://github.com/mrmagic2020/Wrong-Question-Notebook.git
cd Wrong-Question-Notebook/web
nvm use          # or: nvm install 24
npm install
```

### 2. Start the local Supabase stack

```bash
npx supabase start
```

The first run downloads ~2 GB of Docker images (3–10 minutes). Subsequent starts take ~20 seconds.

When it finishes you will see a table of local URLs and API keys:

```
Studio   → http://127.0.0.1:54323     (DB GUI)
API      → http://127.0.0.1:54321     (REST / GraphQL)
DB       → postgresql://postgres:postgres@127.0.0.1:54322/postgres
Mailpit  → http://127.0.0.1:54324     (email testing)
```

Keep these values — you will need the **API URL** and **keys** for the next step.

### 3. Configure environment variables

```bash
cp env.example .env.local
```

Open `.env.local` and fill in the values printed by `supabase start`:

| Variable                                       | Description                             | Local dev value                                                           |
| ---------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Supabase API URL                        | `http://127.0.0.1:54321`                                                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Supabase publishable key                | From `supabase start` output                                              |
| `SUPABASE_SERVICE_ROLE_KEY`                    | Supabase service role key (server-side) | From `supabase start` output                                              |
| `SITE_URL`                                     | Production URL (for sitemap)            | Leave blank for local dev                                                 |
| `GEMINI_API_KEY`                               | Google Gemini API key (AI features)     | Optional — get one at [aistudio.google.com](https://aistudio.google.com/) |

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the landing page. Two test accounts are pre-seeded:

| Account      | Email               | Password      | Role  |
| ------------ | ------------------- | ------------- | ----- |
| Regular user | `test@example.com`  | `password123` | user  |
| Admin        | `admin@example.com` | `password123` | admin |

You can also sign up with any email — Mailpit at `http://127.0.0.1:54324` captures confirmation emails locally.

## Database Workflow

The database schema lives in `web/supabase/migrations/` as timestamped SQL files. The Supabase CLI manages the full lifecycle.

### Applying migrations (reset local DB)

```bash
npx supabase db reset
```

Drops the local database, replays all migrations in order, then runs `supabase/seed.sql` (if present). Use this after pulling new migration files from `main`.

### Generating TypeScript types

After any schema change, regenerate the typed client:

```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

All Supabase client factories use the `Database` generic, so the type checker will catch schema mismatches at compile time.

### Creating a new migration

```bash
npx supabase migration new <descriptive_name>
```

This creates an empty SQL file in `supabase/migrations/`. Write your DDL (`CREATE TABLE`, `ALTER`, `CREATE POLICY`, etc.), then run `npx supabase db reset` to test it against a clean database.

### Pulling remote schema changes

If changes were made directly in the Supabase Dashboard:

```bash
npx supabase db pull
```

This generates a migration file from the diff between local migrations and the remote schema.

## Code Quality

The project enforces consistent code quality through automated tooling:

- **Formatting:** Prettier — single quotes, 2-space indent, LF line endings, 80-char width
- **Linting:** ESLint with TypeScript and Prettier plugins
- **Type checking:** TypeScript in strict mode
- **Testing:** Vitest with coverage via `@vitest/coverage-v8`
- **Pre-push hook:** Husky runs the full check suite before `git push`

### Before every push

```bash
npm run prepush
```

This runs, in order: auto-fix formatting → type-check → lint → format-check → tests → production build. If any step fails, fix the issue before pushing.

## Available Scripts

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

## Pull Request Guidelines

1. **Branch from `main`** and use a descriptive branch name (e.g., `feat/tag-search`, `fix/review-session-crash`)
2. **Run `npm run prepush`** and verify it passes before opening a PR
3. **Keep PRs focused** — one feature or fix per PR
4. **Update the changelog** — add an entry under `## [Unreleased]` in `CHANGELOG.md` for user-facing changes
5. **Regenerate types** if you changed the database schema — commit the updated `lib/database.types.ts`

## Deploying to Vercel

This section is for maintainers deploying the production application.

### Initial setup

1. **Create a Vercel project** at [vercel.com/dashboard](https://vercel.com/dashboard) and import the Git repository
2. **Configure the project:**
    - Framework Preset: **Next.js**
    - Root Directory: **`web`**
    - Build Command: `npm run build`
3. **Set environment variables** in the Vercel dashboard:

    | Variable                                       | Description                   | Required |
    | ---------------------------------------------- | ----------------------------- | -------- |
    | `NEXT_PUBLIC_SUPABASE_URL`                     | Supabase project URL          | Yes      |
    | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Supabase anon / public key    | Yes      |
    | `SUPABASE_SERVICE_ROLE_KEY`                    | Supabase service role key     | Yes      |
    | `SITE_URL`                                     | Production domain URL         | No       |
    | `GEMINI_API_KEY`                               | Google Gemini API key         | No       |
    | `CRON_SECRET`                                  | Secret for cron job endpoints | No       |

4. **Deploy** — Vercel builds and deploys automatically on push to `main`

### Deploying via CLI

```bash
npm i -g vercel
vercel login
cd web
vercel              # preview deployment
vercel --prod       # production deployment
```

### Custom domain

1. Go to your Vercel project → Settings → Domains
2. Add your custom domain and follow the DNS instructions
3. Update the `SITE_URL` environment variable to match

### Post-deployment checklist

- [ ] User registration and login work (Turnstile CAPTCHA appears)
- [ ] Notebook creation and problem management work
- [ ] File uploads function correctly
- [ ] Review sessions and auto-marking work
- [ ] Statistics dashboard loads
- [ ] Cookie consent banner appears on first visit
- [ ] Admin panel is accessible for admin users

## Production Optimisations

- **Image optimisation:** Next.js Image component with WebP/AVIF support
- **Bundle optimisation:** Package imports optimised for `lucide-react`
- **Security headers:** HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **SEO:** Dynamic sitemap and `robots.txt` generation
- **Conditional analytics:** Vercel Analytics and Speed Insights loaded only after cookie consent
- **Turbopack:** Used in development for faster rebuilds

## Security

- **Authentication:** Supabase Auth with middleware session refresh on every request
- **Authorisation:** Role-based access control (user, moderator, admin, super_admin)
- **CAPTCHA:** Cloudflare Turnstile on login and registration
- **Input validation:** Zod schemas validate all API request bodies
- **HTML sanitisation:** DOMPurify + sanitize-html with math content support
- **Rate limiting:** Applied to sensitive API endpoints
- **File uploads:** User-scoped access via Supabase Storage RLS policies
- **Cookie consent:** GDPR-compliant banner; analytics loaded only after opt-in

## Troubleshooting

### Build failures

- Verify all environment variables are set
- Run `npm run type-check` locally to catch TypeScript errors
- Ensure `npm install` completed without errors

### Authentication issues

- Check that `NEXT_PUBLIC_SUPABASE_URL` and the anon key are correct
- For local dev, verify `supabase start` is running
- Check Supabase project status in the dashboard

### Database issues

- Run `npx supabase db reset` to start fresh
- Check `supabase/migrations/` for syntax errors in recent migration files
- Open Studio at `http://127.0.0.1:54323` to inspect the local database

### File upload issues

- Verify Supabase Storage is enabled (it is by default with `supabase start`)
- Check that the `problem-uploads` storage bucket exists
- Review RLS policies on `storage.objects`
