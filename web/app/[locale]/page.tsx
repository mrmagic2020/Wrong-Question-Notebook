import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
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
import { getTranslations } from 'next-intl/server';

const siteUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  alternates: {
    canonical: `${siteUrl}/`,
  },
};

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Landing' });
  const isSignedIn = await (async () => {
    if (!hasEnvVars) return false;
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return Boolean(data?.claims);
  })();

  return (
    <main id="main-content" className="landing-page-bg">
      <div className="flex-1 w-full flex flex-col">
        {/* Navigation */}
        <Navigation />

        {/* Hero Section */}
        <HeroScroll>
          <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left side - text */}
            <div className="space-y-6 text-center lg:text-left">
              <FeatureBadge
                icon={Award}
                label={t('madeByStudents')}
                color="amber"
              />

              <div className="space-y-3">
                <h1 className="landing-hero-title">
                  {t('heroTitle')}{' '}
                  <span className="text-gradient-warm">
                    {t('heroTitleAccent')}
                  </span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  {t('heroSubtitle')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                {isSignedIn ? (
                  <>
                    <Button asChild size="lg" className="btn-cta-primary">
                      <Link href="/subjects">{t('goToShelf')}</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="btn-cta"
                    >
                      <Link href="/problem-sets">{t('viewProblemSets')}</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" className="btn-cta-primary">
                      <Link href="/auth/sign-up">{t('startYourNotebook')}</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="btn-cta"
                    >
                      <Link href="/auth/login">{t('signIn')}</Link>
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
                    label={t('richContent')}
                    color="rose"
                    className="opacity-0"
                    data-animate="features-fade-in-left"
                  />

                  <h2
                    className="opacity-0 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
                    data-animate="features-fade-in-left"
                  >
                    {t('writeMath')}
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
                          {t('latexMath')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('latexMathDesc')}
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-rose-500/10 dark:bg-rose-500/20">
                        <Type className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          {t('fullFormatting')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('fullFormattingDesc')}
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-rose-500/10 dark:bg-rose-500/20">
                        <ImageIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          {t('embedImages')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('embedImagesDesc')}
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-rose-500/10 dark:bg-rose-500/20">
                        <Subscript className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          {t('specialCharacters')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('specialCharactersDesc')}
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
                    placeholderLabel={t('richTextEditor')}
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
                  {t('threeProblemTypes')}
                </h2>
                <p
                  className="opacity-0 landing-section-subtitle"
                  data-animate="features-fade-in-up"
                >
                  {t('threeProblemTypesDesc')}
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
                    <h3 className="landing-card-title">
                      {t('multipleChoice')}
                    </h3>
                    <p className="landing-card-text">{t('mcqDesc')}</p>
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
                    <h3 className="landing-card-title">{t('shortAnswer')}</h3>
                    <p className="landing-card-text">{t('shortAnswerDesc')}</p>
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
                    <h3 className="landing-card-title">
                      {t('extendedAnswer')}
                    </h3>
                    <p className="landing-card-text">
                      {t('extendedAnswerDesc')}
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
                    placeholderLabel={t('smartSetsScreenshot')}
                    accentColor="blue"
                  />
                </div>

                <div className="space-y-6 order-1 lg:order-2">
                  <FeatureBadge
                    icon={Filter}
                    label={t('smartOrganization')}
                    color="blue"
                    className="opacity-0"
                    data-animate="features-fade-in-right"
                  />

                  <h2
                    className="opacity-0 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
                    data-animate="features-fade-in-right"
                  >
                    {t('problemSetsBuild')}
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
                          {t('filterByTags')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('filterByTagsDesc')}
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-blue-500/10 dark:bg-blue-500/20">
                        <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          {t('filterByMastery')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('filterByMasteryDesc')}
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-blue-500/10 dark:bg-blue-500/20">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          {t('filterByLastReview')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('filterByLastReviewDesc')}
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-blue-500/10 dark:bg-blue-500/20">
                        <Shuffle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          {t('randomizeOrder')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('randomizeOrderDesc')}
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
                  label={t('aiPowered')}
                  color="amber"
                  className="opacity-0 mb-6"
                  data-animate="features-fade-in-up"
                />

                <h2
                  className="opacity-0 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
                  data-animate="features-fade-in-up"
                >
                  {t('snapPhoto')}
                </h2>

                <p
                  className="opacity-0 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
                  data-animate="features-fade-in-up"
                >
                  {t('snapPhotoDesc')}
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
                    alt={t('handwrittenAlt')}
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
                  alt={t('extractedAlt')}
                  placeholderLabel={t('extractedLabel')}
                  accentColor="amber"
                />
              </div>

              {/* Badges */}
              <div
                className="opacity-0 flex flex-wrap justify-center gap-3"
                data-animate="features-fade-in-up"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                  {t('photosScans')}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                  {t('mathExtraction')}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                  {t('autoClassifies')}
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
                    label={t('interactiveReview')}
                    color="green"
                    className="opacity-0"
                    data-animate="features-fade-in-left"
                  />

                  <h2
                    className="opacity-0 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
                    data-animate="features-fade-in-left"
                  >
                    {t('studySessions')}
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
                          {t('sessionTimer')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('sessionTimerDesc')}
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-green-500/10 dark:bg-green-500/20">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          {t('autoMarking')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('autoMarkingDesc')}
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-green-500/10 dark:bg-green-500/20">
                        <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          {t('progressBar')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('progressBarDesc')}
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-green-500/10 dark:bg-green-500/20">
                        <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          {t('sessionSummary')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('sessionSummaryDesc')}
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
                    alt={t('reviewScreenshot')}
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
                    alt={t('statisticsScreenshot')}
                    placeholderLabel={t('statisticsScreenshot')}
                    accentColor="orange"
                  />
                </div>

                <div className="space-y-6 order-1 lg:order-2">
                  <FeatureBadge
                    icon={BarChart3}
                    label={t('analytics')}
                    color="orange"
                    className="opacity-0"
                    data-animate="features-fade-in-right"
                  />

                  <h2
                    className="opacity-0 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
                    data-animate="features-fade-in-right"
                  >
                    {t('seeProgress')}
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
                          {t('statusDistribution')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('statusDistributionDesc')}
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-orange-500/10 dark:bg-orange-500/20">
                        <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          {t('studyStreaks')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('studyStreaksDesc')}
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-orange-500/10 dark:bg-orange-500/20">
                        <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          {t('activityHeatmap')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('activityHeatmapDesc')}
                        </span>
                      </span>
                    </li>
                    <li className="features-bullet-item">
                      <span className="features-bullet-icon bg-orange-500/10 dark:bg-orange-500/20">
                        <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-white">
                          {t('weeklyProgress')}
                        </strong>{' '}
                        <span className="text-gray-600 dark:text-gray-400">
                          &mdash; {t('weeklyProgressDesc')}
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
                  {t('andMore')}
                </h2>
                <p
                  className="opacity-0 landing-section-subtitle"
                  data-animate="features-fade-in-up"
                >
                  {t('everyDetail')}
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
                    <h3 className="landing-card-title">
                      {t('subjectOrganization')}
                    </h3>
                    <p className="landing-card-text">{t('subjectOrgDesc')}</p>
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
                    <h3 className="landing-card-title">{t('tagSystem')}</h3>
                    <p className="landing-card-text">{t('tagSystemDesc')}</p>
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
                    <h3 className="landing-card-title">
                      {t('problemSetSharing')}
                    </h3>
                    <p className="landing-card-text">{t('sharingDesc')}</p>
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
                    <h3 className="landing-card-title">{t('darkMode')}</h3>
                    <p className="landing-card-text">{t('darkModeDesc')}</p>
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
                    <h3 className="landing-card-title">
                      {t('statusTracking')}
                    </h3>
                    <p className="landing-card-text">
                      {t('statusTrackingDesc')}
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
                    <h3 className="landing-card-title">
                      {t('studyStreaksMore')}
                    </h3>
                    <p className="landing-card-text">
                      {t('studyStreaksMoreDesc')}
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
                  {t('whyWQN')}
                </h2>
                <p
                  className="opacity-0 landing-section-subtitle"
                  data-animate="features-fade-in-up"
                >
                  {t('compareTraditional')}
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
                  {t('readyToMaster')}
                </h2>
                <p
                  className="opacity-0 text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
                  data-animate="features-fade-in-up"
                >
                  {t('joinStudents')}
                </p>

                <div
                  className="opacity-0 pt-2"
                  data-animate="features-fade-in-up"
                >
                  {isSignedIn ? (
                    <Button asChild size="lg" className="btn-cta-primary">
                      <Link href="/subjects">{t('continueLearning')}</Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="btn-cta-primary">
                      <Link href="/auth/sign-up">{t('startYourNotebook')}</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </FeatureShowcase>

        {/* Footer */}
        <footer className="w-full border-t border-amber-200/30 dark:border-stone-800 glass-effect">
          <div className="landing-section-inner py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Brand */}
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="flex items-center gap-2">
                  <NotebookPen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Wrong Question Notebook
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
                  {t('footerTagline')}
                </p>
              </div>

              {/* Product links */}
              <div className="flex flex-col items-center md:items-start gap-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Product
                </h4>
                <div className="flex flex-col items-center md:items-start gap-1.5 text-sm">
                  <Link
                    href="/auth/login"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {t('signIn')}
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {t('signUp')}
                  </Link>
                </div>
              </div>

              {/* Legal links */}
              <div className="flex flex-col items-center md:items-start gap-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Legal
                </h4>
                <div className="flex flex-col items-center md:items-start gap-1.5 text-sm">
                  <Link
                    href="/privacy"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {t('privacyPolicy')}
                  </Link>
                  <CookiePreferencesTrigger />
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-8 pt-6 border-t border-amber-200/20 dark:border-stone-800 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                &copy; 2025&ndash;2026 MagicWorks. {t('builtWith')}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
