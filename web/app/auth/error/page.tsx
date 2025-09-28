import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthNav } from '@/components/auth-nav';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AuthNav />
      <div className="flex flex-1 w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Sorry, something went wrong.
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {params?.error ? (
                  <p className="text-sm text-muted-foreground">
                    Code error: {params.error}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    An unspecified error occurred.
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/auth/login">Try Login Again</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
