import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  BookOpen,
  ClipboardCheck,
  NotebookPen,
  Search,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasEnvVars } from '@/lib/server-utils';
import { HeroAnimation } from '@/components/landing/hero-animation';

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
        <section className="flex-1 px-6 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left side - text */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 dark:bg-amber-900/30 px-4 py-1.5 text-sm font-medium text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                <Sparkles className="w-3.5 h-3.5" />
                Made by students, for students
              </div>

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
                      <Link href="/auth/sign-up">Get Started Free</Link>
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
        </section>

        {/* How It Works Section */}
        <section className="landing-section bg-amber-50/50 dark:bg-stone-800/20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="landing-section-header">
              <h2 className="landing-section-title">How it works</h2>
              <p className="landing-section-subtitle">
                Three simple steps to turn mistakes into mastery
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 dark:from-amber-700 dark:via-orange-700 dark:to-rose-700" />

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center shadow-sm">
                  <ClipboardCheck className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                </div>
                <div className="space-y-1.5">
                  <span className="landing-step-label text-amber-600 dark:text-amber-400">
                    Step 1
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Add your problems
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[240px] mx-auto leading-relaxed">
                    Log the questions you got wrong and organize them by subject
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/40 border-2 border-orange-300 dark:border-orange-700 flex items-center justify-center shadow-sm">
                  <Search className="w-6 h-6 text-orange-700 dark:text-orange-300" />
                </div>
                <div className="space-y-1.5">
                  <span className="landing-step-label text-orange-600 dark:text-orange-400">
                    Step 2
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Review &amp; practice
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[240px] mx-auto leading-relaxed">
                    Revisit problems that need work and track what&apos;s
                    improving
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative z-10 w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/40 border-2 border-rose-300 dark:border-rose-700 flex items-center justify-center shadow-sm">
                  <Trophy className="w-6 h-6 text-rose-700 dark:text-rose-300" />
                </div>
                <div className="space-y-1.5">
                  <span className="landing-step-label text-rose-600 dark:text-rose-400">
                    Step 3
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Master them
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[240px] mx-auto leading-relaxed">
                    Watch your progress grow as wrong answers become mastered
                    skills
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section — Bento Grid */}
        <section className="landing-section">
          <div className="landing-section-inner">
            <div className="landing-section-header">
              <h2 className="landing-section-title">
                Everything you need to learn smarter
              </h2>
              <p className="landing-section-subtitle">
                Simple tools that make a real difference
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Feature 1 - Large card spanning 2 columns on lg */}
              <div className="landing-card lg:col-span-2 from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200/40 dark:border-blue-800/30">
                <div className="landing-icon-box bg-blue-500/10 dark:bg-blue-500/20">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="landing-card-title">Organize by Subject</h3>
                  <p className="landing-card-text max-w-md">
                    Create subjects for different topics and keep your problems
                    neatly organized. Everything in its place, easy to find when
                    you need it.
                  </p>
                </div>
              </div>

              {/* Feature 2 - Regular card */}
              <div className="landing-card from-emerald-50 to-green-100/50 dark:from-emerald-950/40 dark:to-green-900/20 border-green-200/40 dark:border-green-800/30">
                <div className="landing-icon-box bg-green-500/10 dark:bg-green-500/20">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="landing-card-title">Track Progress</h3>
                  <p className="landing-card-text">
                    See which problems you&apos;ve mastered and which still need
                    attention at a glance.
                  </p>
                </div>
              </div>

              {/* Feature 3 - Regular card */}
              <div className="landing-card from-amber-50 to-yellow-100/50 dark:from-amber-950/40 dark:to-yellow-900/20 border-amber-200/40 dark:border-amber-800/30">
                <div className="landing-icon-box bg-amber-500/10 dark:bg-amber-500/20">
                  <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="landing-card-title">Quick Access</h3>
                  <p className="landing-card-text">
                    Find and review problems instantly with search and
                    filtering. No digging around.
                  </p>
                </div>
              </div>

              {/* Feature 4 - spans 2 columns on lg */}
              <div className="landing-card lg:col-span-2 from-rose-50 to-pink-100/50 dark:from-rose-950/40 dark:to-pink-900/20 border-rose-200/40 dark:border-rose-800/30">
                <div className="landing-icon-box bg-rose-500/10 dark:bg-rose-500/20">
                  <NotebookPen className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="landing-card-title">
                    Rich Notes &amp; Solutions
                  </h3>
                  <p className="landing-card-text max-w-md">
                    Write detailed notes, solutions, and explanations with a
                    full rich-text editor. Add math formulas, images, and more
                    to capture your thinking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Student-focused CTA Section */}
        <section className="landing-section ruled-lines bg-amber-50/30 dark:bg-stone-800/15">
          <div className="max-w-3xl mx-auto text-center px-6">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 dark:bg-rose-900/30 px-3 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/40">
                <NotebookPen className="w-3 h-3" />
                Built by students who&apos;ve been there
              </div>

              <h2 className="landing-section-title">
                Your wrong answers are your best teachers
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                We built this because we needed it ourselves. Stop losing track
                of the problems that matter most.
              </p>

              <div className="pt-2">
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

        {/* Footer */}
        <footer className="w-full border-t border-amber-200/30 dark:border-stone-800 glass-effect">
          <div className="landing-section-inner py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Wrong Question Notebook
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                &copy; 2025&ndash;2026 MagicWorks. Built with Next.js and
                Supabase.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
