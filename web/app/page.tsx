import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { BookOpen, NotebookPen, Target, Zap } from 'lucide-react';
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex-1 w-full flex flex-col">
        {/* Navigation */}
        <Navigation />

        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
          <div className="page-container text-center space-y-8">
            <div className="space-y-4">
              <h1 className="heading-xl text-gradient">Master Your Learning</h1>
              <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
                Organize problems by subject, track your progress, and build
                your knowledge systematically
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isSignedIn ? (
                <>
                  <Button asChild size="lg" className="text-lg px-8 py-6">
                    <Link href="/subjects">Open your notebook</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-6"
                  >
                    <Link href="/problem-sets">View problem sets</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="text-lg px-8 py-6">
                    <Link href="/auth/sign-up">Get Started Free</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-6"
                  >
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="pt-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Made by students • For students
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 bg-white/50 dark:bg-gray-800/50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Everything you need to organize your learning
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Streamline your study process with powerful organization tools
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                    <h3 className="text-xl font-semibold">
                      Organize by Subject
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Create subjects for different topics and organize your
                    problems systematically
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-8 w-8 text-green-600" />
                    <h3 className="text-xl font-semibold">Track Progress</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Monitor your learning journey and identify areas that need
                    more attention
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="h-8 w-8 text-yellow-600" />
                    <h3 className="text-xl font-semibold">Quick Access</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Find and review problems instantly with powerful search and
                    filtering
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20">
          <div className="max-w-4xl mx-auto text-center px-6">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Ready to transform your learning?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Join thousands of learners who are already organizing their
                knowledge effectively
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isSignedIn ? (
                  <>
                    <Button asChild size="lg" className="text-lg px-8 py-6">
                      <Link href="/subjects">Continue in the app</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="text-lg px-8 py-6"
                    >
                      <Link href="/problem-sets">Browse problem sets</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" className="text-lg px-8 py-6">
                      <Link href="/auth/sign-up">Start Your Journey</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="text-lg px-8 py-6"
                    >
                      <Link href="/auth/login">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-foreground/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Wrong Question Notebook</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © 2025 MagicWorks. Built with Next.js and Supabase.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
