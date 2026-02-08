import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import {
  BookOpen,
  NotebookPen,
  Target,
  GraduationCap,
  Lightbulb,
  CheckCircle,
  Search,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasEnvVars } from '@/lib/server-utils';

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
    <main className="min-h-[140vh] bg-gradient-to-b from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex-1 w-full flex flex-col">
        {/* Navigation */}
        <Navigation />

        {/* Hero Section */}
        <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080/gray/gray?text=Subtle+Pattern')] opacity-10" />
          <div className="page-container text-center space-y-8 relative z-10 animate-fade-in-up">
            <div className="space-y-4">
              <h1 className="heading-xl text-gradient bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Master Wrong Questions
              </h1>
              <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The notebook that turns mistakes into mastery. Organize problems
                by subject, track progress, and review smartly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isSignedIn ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="text-lg px-8 py-6 shadow-2xl hover:shadow-3xl transition-all duration-300"
                  >
                    <Link href="/subjects">Open Notebook</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-6 border-2 hover:border-blue-500"
                  >
                    <Link href="/problem-sets">Problem Sets</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="text-lg px-8 py-6 shadow-2xl hover:shadow-3xl transition-all duration-300"
                  >
                    <Link href="/auth/sign-up">Start Free</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-6 border-2 hover:border-blue-500"
                  >
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="pt-12 animate-fade-in">
              <p className="text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                Made by students • For students
              </p>
            </div>
          </div>
        </section>

        {/* Backstory Section */}
        <section className="w-full py-24 bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border-b border-white/50 dark:border-gray-700/50">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 px-4 py-2 rounded-full">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-sm uppercase tracking-wide">
                  My Story
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Why I Built WQN
              </h2>
              <div className="prose prose-lg max-w-3xl mx-auto text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                  As a Year 11 student drowning in maths comps, HSC prep, and
                  endless wrong answers, I scribbled mistakes in notebooks. It
                  helped, but searching/revisiting was chaos — lost pages,
                  forgotten insights.
                </p>
                <p>
                  WQN digitizes that: categorize by subject (Maths, English
                  Extension, etc.), tag assessments/exams, track progress. No
                  more lost knowledge. Mistakes become your superpower.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-20 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Everything You Need to Organize Learning
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Powerful tools designed by a student, for students
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl mb-6 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                    <BookOpen className="h-8 w-8 text-blue-600 group-hover:rotate-12 transition-transform" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-3 text-center">
                    Subjects
                  </CardTitle>
                  <CardDescription className="text-center text-gray-600 dark:text-gray-300 leading-relaxed">
                    Organize problems by Maths, English, Science — never lose
                    track again
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-2xl mb-6 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                    <Target className="h-8 w-8 text-green-600 group-hover:rotate-12 transition-transform" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-3 text-center">
                    Progress
                  </CardTitle>
                  <CardDescription className="text-center text-gray-600 dark:text-gray-300 leading-relaxed">
                    Track solved/pending, spot weak areas, celebrate mastery
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/50 rounded-2xl mb-6 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800 transition-colors">
                    <CheckCircle className="h-8 w-8 text-yellow-600 group-hover:rotate-12 transition-transform" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-3 text-center">
                    Problem Sets
                  </CardTitle>
                  <CardDescription className="text-center text-gray-600 dark:text-gray-300 leading-relaxed">
                    Assessments, exams, homework — group and review efficiently
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl mb-6 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                    <Search className="h-8 w-8 text-indigo-600 group-hover:rotate-12 transition-transform" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-3 text-center">
                    Search
                  </CardTitle>
                  <CardDescription className="text-center text-gray-600 dark:text-gray-300 leading-relaxed">
                    Tags, subjects, dates — find any problem instantly
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="w-full py-24 bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border-b border-white/50 dark:border-gray-700/50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-20 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Three simple steps to turn mistakes into mastery
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 items-start">
              <div className="text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Add Problem</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Snap photo or type wrong question, assign subject/tags
                </p>
              </div>

              <div className="text-center animate-fade-in-up animation-delay-200">
                <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Categorize & Track</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Group into problem sets, mark solved/pending, due dates
                </p>
              </div>

              <div className="text-center animate-fade-in-up animation-delay-400">
                <div className="w-20 h-20 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Review & Master</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Search, filter weak areas, spaced repetition built-in
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full py-24">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Students Love It
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mt-4">
                Join hundreds mastering their studies
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-xl p-8">
                <CardContent>
                  <p className="italic text-gray-700 dark:text-gray-300 mb-6">
                    "Finally a place to track every wrong question from maths
                    comps. My HSC prep is 10x better."
                  </p>
                  <div className="flex items-end gap-3 mt-auto">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">A</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">Alex C.</p>
                      <p className="text-sm text-gray-500 truncate">
                        Year 12, Maths
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl p-8">
                <CardContent className="h-full flex flex-col justify-between">
                  <p className="italic text-gray-700 dark:text-gray-300 flex-1">
                    "English Extension essays? Organized. Assessments? Tracked.
                    Game changer."
                  </p>
                  <div className="flex items-end gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">S</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">Sarah L.</p>
                      <p className="text-sm text-gray-500 truncate">
                        Year 11, English
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-xl p-8">
                <CardContent>
                  <p className="italic text-gray-700 dark:text-gray-300 mb-6">
                    "Science problems from nowhere. Tags + search = never forget
                    again."
                  </p>
                  <div className="flex items-end gap-3 mt-auto">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">J</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">Jamie K.</p>
                      <p className="text-sm text-gray-500 truncate">
                        Year 12, Science
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-24 bg-gradient-to-r from-blue-600/95 to-indigo-600/95 text-white backdrop-blur-md border-b border-blue-500/30">
          <div className="max-w-4xl mx-auto text-center px-6">
            <div className="space-y-8 animate-fade-in-up">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Master Your Wrong Questions?
                </h2>
                <p className="text-xl opacity-90">
                  Start free — no credit card needed
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isSignedIn ? (
                  <Button
                    asChild
                    size="lg"
                    className="text-lg px-12 py-8 bg-white text-blue-600 hover:bg-gray-100 font-bold shadow-2xl"
                  >
                    <Link href="/subjects">Jump In</Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="lg"
                    className="text-lg px-12 py-8 shadow-2xl hover:shadow-3xl font-bold"
                  >
                    <Link href="/auth/sign-up">Start Free</Link>
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-lg px-12 py-8 bg-white/10 hover:bg-white/20 border-2 border-white/50 backdrop-blur-sm font-bold shadow-lg"
                >
                  <Link href="/auth/login">Have Account?</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-foreground/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-3">
                <NotebookPen className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold">
                  Wrong Question Notebook
                </span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <Link
                  href="/privacy"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Terms
                </Link>
                <span>•</span>
                <span>© 2026 MagicWorks. Next.js + Supabase</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
