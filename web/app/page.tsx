import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  CircleDot,
  Clock,
  FileText,
  Filter,
  Flame,
  ImageIcon,
  Moon,
  MoveDown,
  NotebookPen,
  PenLine,
  PieChart,
  Play,
  Share2,
  Shuffle,
  Sigma,
  Sparkles,
  Subscript,
  Tags,
  Target,
  TrendingUp,
  Type,
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { hasEnvVars } from '@/lib/server-utils';
import { HeroAnimation } from '@/components/landing/hero-animation';
import { HeroScroll } from '@/components/landing/hero-scroll';
import { FeatureShowcase } from '@/components/features/feature-showcase';
import { ScreenshotFrame } from '@/components/features/screenshot-frame';
import { ComparisonTable } from '@/components/features/comparison-table';
import { FeatureBadge } from '@/components/features/feature-badge';
import { CookiePreferencesTrigger } from '@/components/cookie-consent/cookie-preferences-trigger';

const siteUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  alternates: {
    canonical: `${siteUrl}/`,
  },
};

export default async function Home() {
  const isSignedIn = await (async () => {
    if (!hasEnvVars) return false;
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return Boolean(data?.claims);
  })();

  return (
    <main className="landing-page-bg">
      <div className="flex-1 w-full flex flex-col">
        {/* Navigation */}
        <Navigation />

        {/* Hero Section */}
        <HeroScroll>
          <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left side - text */}
            <div className="space-y-6 text-center lg:text-left">
              <FeatureBadge icon={Award} label="Made by students, for students" color="amber" />

              <div className="space-y-3">
                <h1 className="landing-hero-title">
                  Turn wrong answers into{' '}
                  <span className="text-gradient-warm">mastered skills</span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Organize the problems you got wrong, track your progress, and
                  watch your understanding grow — one question at a time.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                {isSignedIn ? (
                  <>
                    <Button asChild size="lg" className="btn-cta-primary">
                      <Link href="/subjects">Go to shelf</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="btn-cta"
                    >
                      <Link href="/problem-sets">View problem sets</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" className="btn-cta-primary">
                      <Link href="/auth/sign-up">Start Your Notebook</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="btn-cta"
                    >
                      <Link href="/auth/login">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Right side - animated mockup */}
            <div className="lg:pl-4">
              <HeroAnimation />
            </div>
          </div>
        </HeroScroll>

        <FeatureShowcase>
          {/* Rich Text + Math */}
          <section className="landing-section">
            <div className="landing-section-inner">
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div className="space-y-6">
                  <FeatureBadge
                    icon={NotebookPen}
                    label="Rich Content"
                    color="rose"
                    className="opacity-0"
                    data-animate="features-fade-in-left"
                  />

                  <h2
                    className="opacity-0 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
                    data-animate="features-fade-in-left"
                  >
                    Write math, format solutions, capture everything
                  </h2>

                  <ul
                    className="opacity-0 features-bullet-list"
                    data-animate="features-fade-in-left"
                  >
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-rose-500/10 dark:bg-rose-500/20">
                        <Sigma className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          LaTeX math
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; inline and block equations
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-rose-500/10 dark:bg-rose-500/20">
                        <Type className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Full formatting
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; headings, bold, italic, lists, code blocks
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-rose-500/10 dark:bg-rose-500/20">
                        <ImageIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Embed images
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; directly in problems and solutions
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-rose-500/10 dark:bg-rose-500/20">
                        <Subscript className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Special characters
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; subscript, superscript, and more
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>

                <div
                  className="opacity-0"
                  data-animate="features-fade-in-right"
                >
                  <ScreenshotFrame
                    src="/features/editor-math.png"
                    darkSrc="/features/editor-math-dark.png"
                    alt="TipTap editor showing a math formula with toolbar"
                    placeholderLabel="Rich text editor with math"
                    accentColor="rose"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Problem Types */}
          <section className="landing-section bg-amber-50/30 dark:bg-stone-800/20">
            <div className="landing-section-inner">
              <div className="landing-section-header">
                <h2
                  className="opacity-0 landing-section-title"
                  data-animate="features-fade-in-up"
                >
                  Three problem types, one notebook
                </h2>
                <p
                  className="opacity-0 landing-section-subtitle"
                  data-animate="features-fade-in-up"
                >
                  MCQ, short answer, or extended &mdash; WQN handles them all
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div
                  className="opacity-0 landing-card from-amber-50 to-yellow-100/50 dark:from-amber-950/40 dark:to-yellow-900/20 border-amber-200/40 dark:border-amber-800/30"
                  data-animate="features-fade-in-up"
                >
                  <div className="landing-icon-box bg-amber-500/10 dark:bg-amber-500/20">
                    <CircleDot className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="landing-card-title">Multiple Choice</h3>
                    <p className="landing-card-text">
                      Radio button choices with auto-marking and a visual choice
                      picker. Know instantly if you got it right.
                    </p>
                  </div>
                </div>

                <div
                  className="opacity-0 landing-card from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20 border-orange-200/40 dark:border-orange-800/30"
                  data-animate="features-fade-in-up"
                >
                  <div className="landing-icon-box bg-orange-500/10 dark:bg-orange-500/20">
                    <PenLine className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="landing-card-title">Short Answer</h3>
                    <p className="landing-card-text">
                      Text or numeric answers with tolerance. Supports multiple
                      accepted answers for flexible marking.
                    </p>
                  </div>
                </div>

                <div
                  className="opacity-0 landing-card from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200/40 dark:border-blue-800/30"
                  data-animate="features-fade-in-up"
                >
                  <div className="landing-icon-box bg-blue-500/10 dark:bg-blue-500/20">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="landing-card-title">Extended Answer</h3>
                    <p className="landing-card-text">
                      Free-form responses for proofs, essays, and explanations.
                      Full rich-text support included.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Smart Problem Sets */}
          <section className="landing-section">
            <div className="landing-section-inner">
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div
                  className="opacity-0 order-2 lg:order-1"
                  data-animate="features-fade-in-left"
                >
                  <ScreenshotFrame
                    src="/features/smart-sets.png"
                    darkSrc="/features/smart-sets-dark.png"
                    alt="Smart problem set creation dialog with filter options"
                    placeholderLabel="Smart problem set filters"
                    accentColor="blue"
                  />
                </div>

                <div className="space-y-6 order-1 lg:order-2">
                  <FeatureBadge
                    icon={Filter}
                    label="Smart Organization"
                    color="blue"
                    className="opacity-0"
                    data-animate="features-fade-in-right"
                  />

                  <h2
                    className="opacity-0 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
                    data-animate="features-fade-in-right"
                  >
                    Problem sets that build themselves
                  </h2>

                  <ul
                    className="opacity-0 features-bullet-list"
                    data-animate="features-fade-in-right"
                  >
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-blue-500/10 dark:bg-blue-500/20">
                        <Tags className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Filter by tags
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; for targeted review
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-blue-500/10 dark:bg-blue-500/20">
                        <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Filter by mastery status
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; focus on what needs work
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-blue-500/10 dark:bg-blue-500/20">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Filter by last review
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; catch problems slipping away
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-blue-500/10 dark:bg-blue-500/20">
                        <Shuffle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Randomize order
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; and set session sizes
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* AI Extraction */}
          <section className="landing-section bg-amber-50/30 dark:bg-stone-800/20">
            <div className="landing-section-inner space-y-10">
              {/* Header */}
              <div className="text-center">
                <FeatureBadge
                  icon={Sparkles}
                  label="AI-Powered"
                  color="amber"
                  className="opacity-0 mb-6"
                  data-animate="features-fade-in-up"
                />

                <h2
                  className="opacity-0 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
                  data-animate="features-fade-in-up"
                >
                  Got a problem? Snap a photo
                </h2>

                <p
                  className="opacity-0 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
                  data-animate="features-fade-in-up"
                >
                  Upload an image of any worksheet or handwritten note. Our AI
                  extracts the problem, detects math, and classifies the type
                  &mdash; instantly.
                </p>
              </div>

              {/* Before → After transformation */}
              <div
                className="opacity-0 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-4 items-center max-w-5xl mx-auto"
                data-animate="features-fade-in-up"
              >
                {/* Left: Handwritten photo */}
                <div className="features-photo-frame">
                  <Image
                    src="/features/handwritten-problem.png"
                    alt="Handwritten math problem on paper"
                    width={600}
                    height={400}
                    className="w-full h-auto"
                  />
                </div>

                {/* Arrow connector */}
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center shadow-sm">
                    <ArrowRight className="w-5 h-5 text-amber-700 dark:text-amber-300 hidden lg:block" />
                    <MoveDown className="w-5 h-5 text-amber-700 dark:text-amber-300 lg:hidden" />
                  </div>
                </div>

                {/* Right: Extracted result in app */}
                <ScreenshotFrame
                  src="/features/ai-extraction.png"
                  darkSrc="/features/ai-extraction-dark.png"
                  alt="Extracted problem formatted in WQN"
                  placeholderLabel="Extracted problem in WQN"
                  accentColor="amber"
                />
              </div>

              {/* Badges */}
              <div
                className="opacity-0 flex flex-wrap justify-center gap-3"
                data-animate="features-fade-in-up"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                  Photos &amp; scans
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                  Math extraction
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                  Auto-classifies type
                </span>
              </div>
            </div>
          </section>

          {/* Review Sessions */}
          <section className="landing-section">
            <div className="landing-section-inner">
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div className="space-y-6">
                  <FeatureBadge
                    icon={Play}
                    label="Interactive Review"
                    color="green"
                    className="opacity-0"
                    data-animate="features-fade-in-left"
                  />

                  <h2
                    className="opacity-0 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
                    data-animate="features-fade-in-left"
                  >
                    Study sessions that track your progress
                  </h2>

                  <ul
                    className="opacity-0 features-bullet-list"
                    data-animate="features-fade-in-left"
                  >
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-green-500/10 dark:bg-green-500/20">
                        <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Session timer
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; tracks study time
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-green-500/10 dark:bg-green-500/20">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Auto-marking
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; for MCQ and short answer
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-green-500/10 dark:bg-green-500/20">
                        <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Progress bar
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; shows session completion
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-green-500/10 dark:bg-green-500/20">
                        <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Session summary
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; with detailed stats
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>

                <div
                  className="opacity-0"
                  data-animate="features-fade-in-right"
                >
                  <ScreenshotFrame
                    src="/features/review-session.png"
                    darkSrc="/features/review-session-dark.png"
                    alt="Active review session with problem, timer, and progress bar"
                    placeholderLabel="Interactive review session"
                    accentColor="green"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Statistics Dashboard */}
          <section className="landing-section bg-amber-50/30 dark:bg-stone-800/20">
            <div className="landing-section-inner">
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div
                  className="opacity-0 order-2 lg:order-1"
                  data-animate="features-fade-in-left"
                >
                  <ScreenshotFrame
                    src="/features/statistics.png"
                    darkSrc="/features/statistics-dark.png"
                    alt="Statistics dashboard with charts and heatmap"
                    placeholderLabel="Statistics dashboard"
                    accentColor="orange"
                  />
                </div>

                <div className="space-y-6 order-1 lg:order-2">
                  <FeatureBadge
                    icon={BarChart3}
                    label="Analytics"
                    color="orange"
                    className="opacity-0"
                    data-animate="features-fade-in-right"
                  />

                  <h2
                    className="opacity-0 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
                    data-animate="features-fade-in-right"
                  >
                    See how far you&apos;ve come
                  </h2>

                  <ul
                    className="opacity-0 features-bullet-list"
                    data-animate="features-fade-in-right"
                  >
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-orange-500/10 dark:bg-orange-500/20">
                        <PieChart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Status distribution
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; and subject breakdown charts
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-orange-500/10 dark:bg-orange-500/20">
                        <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Study streaks
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; with longest streak record
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-orange-500/10 dark:bg-orange-500/20">
                        <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Activity heatmap
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; showing daily study habits
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-orange-500/10 dark:bg-orange-500/20">
                        <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          Weekly progress
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; line charts over time
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* More Features */}
          <section className="landing-section">
            <div className="landing-section-inner">
              <div className="landing-section-header">
                <h2
                  className="opacity-0 landing-section-title"
                  data-animate="features-fade-in-up"
                >
                  And there&apos;s more
                </h2>
                <p
                  className="opacity-0 landing-section-subtitle"
                  data-animate="features-fade-in-up"
                >
                  Every detail designed to help you study better
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div
                  className="opacity-0 landing-card from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200/40 dark:border-blue-800/30"
                  data-animate="features-fade-in-up"
                >
                  <div className="landing-icon-box bg-blue-500/10 dark:bg-blue-500/20">
                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="landing-card-title">Subject Organization</h3>
                    <p className="landing-card-text">
                      Color-coded notebooks with custom icons. Keep every
                      subject neatly separated and easy to find.
                    </p>
                  </div>
                </div>

                <div
                  className="opacity-0 landing-card from-amber-50 to-yellow-100/50 dark:from-amber-950/40 dark:to-yellow-900/20 border-amber-200/40 dark:border-amber-800/30"
                  data-animate="features-fade-in-up"
                >
                  <div className="landing-icon-box bg-amber-500/10 dark:bg-amber-500/20">
                    <Tags className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="landing-card-title">Tag System</h3>
                    <p className="landing-card-text">
                      Subject-specific tags for fine-grained categorization.
                      Filter and find problems in seconds.
                    </p>
                  </div>
                </div>

                <div
                  className="opacity-0 landing-card from-rose-50 to-pink-100/50 dark:from-rose-950/40 dark:to-pink-900/20 border-rose-200/40 dark:border-rose-800/30"
                  data-animate="features-fade-in-up"
                >
                  <div className="landing-icon-box bg-rose-500/10 dark:bg-rose-500/20">
                    <Share2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="landing-card-title">Problem Set Sharing</h3>
                    <p className="landing-card-text">
                      Private, limited, or public sharing options. Share your
                      curated problem sets with classmates.
                    </p>
                  </div>
                </div>

                <div
                  className="opacity-0 landing-card from-gray-50 to-gray-100/50 dark:from-gray-950/40 dark:to-gray-900/20 border-gray-200/40 dark:border-gray-800/30"
                  data-animate="features-fade-in-up"
                >
                  <div className="landing-icon-box bg-gray-500/10 dark:bg-gray-500/20">
                    <Moon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="landing-card-title">Dark Mode</h3>
                    <p className="landing-card-text">
                      Full light and dark theme support. Study comfortably at
                      any hour.
                    </p>
                  </div>
                </div>

                <div
                  className="opacity-0 landing-card from-emerald-50 to-green-100/50 dark:from-emerald-950/40 dark:to-green-900/20 border-green-200/40 dark:border-green-800/30"
                  data-animate="features-fade-in-up"
                >
                  <div className="landing-icon-box bg-green-500/10 dark:bg-green-500/20">
                    <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="landing-card-title">Status Tracking</h3>
                    <p className="landing-card-text">
                      Wrong, Needs Review, Mastered &mdash; track every
                      problem&apos;s progression automatically.
                    </p>
                  </div>
                </div>

                <div
                  className="opacity-0 landing-card from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20 border-orange-200/40 dark:border-orange-800/30"
                  data-animate="features-fade-in-up"
                >
                  <div className="landing-icon-box bg-orange-500/10 dark:bg-orange-500/20">
                    <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="landing-card-title">Study Streaks</h3>
                    <p className="landing-card-text">
                      Consecutive day tracking to build habits. Stay motivated
                      and keep your streak alive.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Comparison Table */}
          <section className="landing-section bg-amber-50/30 dark:bg-stone-800/20">
            <div className="landing-section-inner">
              <div className="landing-section-header">
                <h2
                  className="opacity-0 landing-section-title"
                  data-animate="features-fade-in-up"
                >
                  Why Wrong Question Notebook?
                </h2>
                <p
                  className="opacity-0 landing-section-subtitle"
                  data-animate="features-fade-in-up"
                >
                  See how WQN compares to traditional methods
                </p>
              </div>

              <div
                className="opacity-0 rounded-2xl border border-gray-200/60 dark:border-gray-800/40 bg-white/60 dark:bg-gray-900/40 overflow-hidden shadow-sm"
                data-animate="features-fade-in-up"
              >
                <ComparisonTable />
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="landing-section ruled-lines bg-amber-50/30 dark:bg-stone-800/15">
            <div className="max-w-3xl mx-auto text-center px-6">
              <div className="space-y-6">
                <h2
                  className="opacity-0 landing-section-title"
                  data-animate="features-fade-in-up"
                >
                  Ready to turn mistakes into mastery?
                </h2>
                <p
                  className="opacity-0 text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
                  data-animate="features-fade-in-up"
                >
                  Join students who are learning smarter with Wrong Question
                  Notebook.
                </p>

                <div
                  className="opacity-0 pt-2"
                  data-animate="features-fade-in-up"
                >
                  {isSignedIn ? (
                    <Button asChild size="lg" className="btn-cta-primary">
                      <Link href="/subjects">Continue learning</Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="btn-cta-primary">
                      <Link href="/auth/sign-up">Start Your Notebook</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </FeatureShowcase>

        {/* Footer */}
        <footer className="w-full border-t border-amber-200/30 dark:border-stone-800 glass-effect">
          <div className="landing-section-inner py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Wrong Question Notebook
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Link
                  href="/privacy"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
                <CookiePreferencesTrigger />
                <p className="text-gray-500 dark:text-gray-400">
                  &copy; 2025&ndash;2026 MagicWorks. Built with Next.js and
                  Supabase.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
