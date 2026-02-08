# Wrong Question Notebook (WQN)

A student-focused web app for logging wrong answers, organizing them by subject, and tracking mastery over time. Built with Next.js, Supabase, and Tailwind CSS.

## Project Structure

All application code lives in `web/`:

```txt
web/
  app/              # Next.js App Router pages & API routes
    (app)/          # Authenticated app pages (subjects, problem-sets, tags, etc.)
    auth/           # Auth pages (login, sign-up, forgot-password, etc.)
    api/            # API route handlers
    page.tsx        # Landing page (public)
    layout.tsx      # Root layout (Geist font, ThemeProvider, analytics)
    globals.css     # Global styles, CSS utility classes, keyframe animations
  components/
    ui/             # shadcn/ui primitives (Button, Card, Dialog, Input, etc.)
    landing/        # Landing page components (hero-animation.tsx)
    navigation.tsx  # Shared navigation bar
    ...             # Feature-specific components
  lib/              # Utilities, Supabase clients, schemas, types
```

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack dev)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 3 + `tailwindcss-animate`
- **Components:** shadcn/ui (Radix UI primitives + CVA)
- **Icons:** lucide-react
- **Font:** Geist (via `next/font/google`)
- **Auth/DB:** Supabase (SSR client)
- **Theme:** `next-themes` with `class` strategy, system default
- **Rich text:** TipTap editor + KaTeX math rendering
- **Formatting:** Prettier (single quotes, 2-space indent, LF line endings, 80 char width)
- **Linting:** ESLint with prettier plugin

## Commands

Run from `web/`:

| Command              | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `npm run dev`        | Start dev server (Turbopack)                               |
| `npm run build`      | Production build                                           |
| `npm run type-check` | TypeScript check (`tsc --noEmit`)                          |
| `npm run lint`       | ESLint check                                               |
| `npm run fix-all`    | Auto-fix lint + format                                     |
| `npm run prepush`    | Full check: fix-all, type-check, lint, format-check, build |

Always run `npm run prepush` before committing to catch issues.

---

## UI Design Guidelines

The landing page (`web/app/page.tsx`) is the canonical reference for WQN's visual identity. All UI work across the product should follow these conventions.

### Design Identity

WQN's visual language is **playful & warm** -- approachable for students, not corporate. Think notebook-on-a-desk, not enterprise dashboard.

Key traits:

- **Warm palette** over cold/neutral: amber, orange, rose as primary accents; blue and green as secondary
- **Generous rounding**: `rounded-2xl` for cards and containers, `rounded-xl` for buttons and icons, `rounded-full` for badges/pills
- **Soft depth**: light box shadows (`shadow-sm`, `shadow-md`), subtle borders with low opacity (`border-amber-200/40`)
- **Notebook metaphors**: ruled-line backgrounds, paper textures, pencil/pen icons (`NotebookPen` from lucide-react)
- **No harsh contrasts**: use opacity modifiers (`/80`, `/50`, `/30`) on backgrounds and borders to keep things gentle

### Color System

#### Light mode backgrounds

- **Page-level gradients:** `from-amber-50/80 via-white to-rose-50/50` (warm tinted, not pure white)
- **Section bands:** `bg-amber-50/50` for alternating sections
- **Card fills:** gradient `from-{color}-50 to-{color}-100/50` per-feature (e.g. `from-blue-50 to-blue-100/50`)
- **Icon containers:** `bg-{color}-500/10` (very faint tint)

#### Dark mode backgrounds

- **Page-level:** `dark:from-gray-900 dark:via-gray-900 dark:to-gray-900` (flat dark, no gradient)
- **Section bands:** `dark:bg-gray-800/30`
- **Card fills:** `dark:from-{color}-950/40 dark:to-{color}-900/20`
- **Icon containers:** `dark:bg-{color}-500/20`

#### Text colors

- **Headings:** `text-gray-900 dark:text-white`
- **Body text:** `text-gray-600 dark:text-gray-400`
- **Muted/captions:** `text-gray-500 dark:text-gray-400`
- **Colored accents:** use `{color}-600` light / `{color}-400` dark (e.g. `text-amber-600 dark:text-amber-400`)

#### Borders

- **Cards/containers:** `border-{color}-200/40 dark:border-{color}-800/30` (low-opacity, tinted)
- **Dividers:** `border-amber-200/30 dark:border-gray-800`

#### Warm accent palette (use these for feature differentiation)

| Purpose            | Light      | Dark       |
| ------------------ | ---------- | ---------- |
| Primary warm       | amber-600  | amber-400  |
| Secondary warm     | orange-600 | orange-400 |
| Tertiary warm      | rose-600   | rose-400   |
| Info / organize    | blue-600   | blue-400   |
| Success / progress | green-600  | green-400  |

### Typography

Font is **Geist** (loaded globally, no per-component font setup needed).

- **Hero headline:** use `landing-hero-title` class
- **Section headings:** use `landing-section-title` class
- **Section subtitles:** use `landing-section-subtitle` class
- **Card titles:** use `landing-card-title` class
- **Card body text:** use `landing-card-text` class
- **Step labels:** use `landing-step-label` class (add color per-step via `text-{color}-600 dark:text-{color}-400`)
- **Labels/badges:** `text-sm font-medium` for pill badges
- **Gradient text:** use `text-gradient-warm` class (amber -> orange -> rose) for emphasis spans

### Component Patterns

All reusable patterns below have corresponding CSS classes in `globals.css`. Use the classes rather than repeating raw Tailwind utilities.

#### Section layout

```html
<section className="landing-section {optional-bg}">
    <div className="landing-section-inner">
        <!-- max-w-6xl; override to max-w-5xl/3xl if narrower -->
        <div className="landing-section-header">
            <h2 className="landing-section-title">...</h2>
            <p className="landing-section-subtitle">...</p>
        </div>
        {content}
    </div>
</section>
```

#### Page background

Use `landing-page-bg` on the `<main>` element for the warm amber-to-rose gradient with dark mode support.

#### Feature cards (bento grid)

```html
<div
    className="landing-card from-{color}-50 to-{color}-100/50 dark:from-{color}-950/40 dark:to-{color}-900/20 border-{color}-200/40 dark:border-{color}-800/30"
>
    <div className="landing-icon-box bg-{color}-500/10 dark:bg-{color}-500/20">
        <Icon className="w-6 h-6 text-{color}-600 dark:text-{color}-400" />
    </div>
    <div className="space-y-2">
        <h3 className="landing-card-title">...</h3>
        <p className="landing-card-text">...</p>
    </div>
</div>
```

`landing-card` provides the shared structure (rounded-2xl, padding, flex layout, `bg-gradient-to-br`, `border`). Add the color-specific `from-`/`to-`/`border-` utilities per card. Use `lg:col-span-2` for wide cards in a 3-column grid.

#### Icon containers

Use `landing-icon-box` and add color: `bg-{color}-500/10 dark:bg-{color}-500/20`.
Icons inside: `w-6 h-6 text-{color}-600 dark:text-{color}-400`.

#### Pill badges (sticker-like)

```txt
inline-flex items-center gap-2 rounded-full bg-amber-100/80 dark:bg-amber-900/30
px-4 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-300
border border-amber-200/50 dark:border-amber-800/40
```

Swap color family (amber, rose, blue, etc.) to change the badge theme. (Not extracted to a class because the color must vary per instance.)

#### Buttons (CTA style)

```html
<button asChild size="lg" className="btn-cta-primary">
    <!-- primary: has shadow -->
    <button asChild variant="outline" size="lg" className="btn-cta">
        <!-- secondary: no shadow -->
    </button>
</button>
```

`btn-cta` = shared sizing/rounding (`text-base px-7 py-5 rounded-xl`). `btn-cta-primary` extends it with `shadow-md`.

### Dark Mode

Every visual element must have a `dark:` counterpart. The pattern is consistent:

- Light warm tints (amber-50, rose-50) become dark muted tones (gray-800/30, {color}-950/40)
- Light text (gray-900) becomes white; body text (gray-600) becomes gray-400
- Borders drop opacity further in dark mode (`/30` instead of `/40`)
- Gradients flatten in dark mode (single dark tone, not multi-color gradients)

### Animation

Animations live in `globals.css` as `@keyframes` rules with corresponding utility classes in `@layer components`.

Naming convention: `hero-` prefix for landing page animations. For other pages, use a descriptive prefix (e.g. `card-`, `page-`).

Pattern for staggered entrance animations:

1. Define a base keyframe (e.g. `heroSlideInRight`)
2. Create CSS classes with increasing delays: `0.6s`, `0.9s`, `1.2s`
3. Use `animation: {name} {duration} ease-out {delay} both` (`both` fill mode is important)

Keep animations subtle: small translate distances (8-24px), short durations (0.4-0.8s), `ease-out` easing.

### Server vs Client Components

- Pages (`page.tsx`) stay as **async server components** when they need Supabase auth checks
- Interactive/animated UI gets extracted to **separate client components** (`'use client'`) in a subdirectory (e.g. `components/landing/`)
- This keeps pages server-rendered while allowing client-side interactivity

### Existing CSS Utility Classes

Defined in `globals.css` under `@layer components`. Use these instead of reinventing:

**General utilities:**

| Class                                                    | Purpose                                                           |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| `text-gradient`                                          | Blue-to-indigo gradient text                                      |
| `text-gradient-warm`                                     | Amber-to-orange-to-rose gradient text                             |
| `glass-effect`                                           | Frosted glass background (`bg-white/80 backdrop-blur-sm`)         |
| `shadow-soft`                                            | Subtle shadow (`shadow-lg shadow-black/5`)                        |
| `ruled-lines`                                            | Notebook ruled-line repeating background                          |
| `heading-xl` through `heading-xs`                        | Typography scale (app pages)                                      |
| `text-body-lg`, `text-body`, `text-body-sm`              | Body text scale                                                   |
| `page-container`                                         | Standard app page width + padding (`max-w-6xl mx-auto px-4 py-6`) |
| `status-mastered`, `status-wrong`, `status-needs-review` | Problem status badges                                             |

**Landing / marketing page classes:**

| Class                      | Purpose                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| `landing-page-bg`          | Warm amber-to-rose page gradient with dark mode                          |
| `landing-section`          | Full-width section with `py-20`                                          |
| `landing-section-inner`    | Centered content container (`max-w-6xl mx-auto px-6`)                    |
| `landing-section-header`   | Centered header group with bottom margin                                 |
| `landing-section-title`    | Section heading (`text-3xl md:text-4xl font-bold`) with colors           |
| `landing-section-subtitle` | Section subtitle (`text-lg`) with muted color and max-width              |
| `landing-hero-title`       | Hero headline with responsive sizing and tight leading                   |
| `landing-card`             | Bento card base: rounded-2xl, padding, flex layout, gradient bg + border |
| `landing-card-title`       | Card heading (`text-xl font-semibold`) with colors                       |
| `landing-card-text`        | Card body text with muted color and relaxed leading                      |
| `landing-icon-box`         | 48px rounded icon container (add `bg-{color}` per use)                   |
| `landing-step-label`       | Uppercase bold label for numbered steps (add color per use)              |
| `btn-cta`                  | CTA button sizing: `text-base px-7 py-5 rounded-xl`                      |
| `btn-cta-primary`          | Extends `btn-cta` with `shadow-md` for primary actions                   |

### Checklist for UI Changes

When building or redesigning any page/component:

1. **Read the landing page first** (`web/app/page.tsx`) to absorb the current visual patterns
2. **Use warm colors by default** -- amber/orange/rose, not cold grays or blues
3. **Apply generous rounding** -- `rounded-2xl` for containers, `rounded-xl` for interactive elements
4. **Always provide dark mode** -- every `bg-`, `text-`, `border-` class needs a `dark:` pair
5. **Use opacity modifiers** on backgrounds and borders (`/80`, `/50`, `/30`) for softness
6. **Keep animations subtle** -- small transforms, short durations, `ease-out`
7. **Extract client components** if the page needs to remain a server component
8. **Reuse existing CSS classes** from `globals.css` before writing new ones
9. **Use lucide-react icons** -- consistent with the rest of the app
10. **Run `npm run prepush`** in `web/` before finishing to verify everything passes
