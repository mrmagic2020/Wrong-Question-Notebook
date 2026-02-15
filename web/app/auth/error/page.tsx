import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Auth Error – Wrong Question Notebook',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <div className="w-full auth-fade-in">
          <div className="auth-card-red">
            {/* Icon header */}
            <div className="flex justify-center mb-6 auth-icon-entrance">
              <div className="auth-icon-box-red">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6 space-y-2">
              <h1 className="auth-title">Something went wrong</h1>
              <p className="auth-subtitle">
                We encountered an error while processing your request
              </p>
            </div>

            {/* Error message */}
            <div className="auth-slide-up space-y-6">
              {params?.error ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Error code: <span className="font-mono">{params.error}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  An unspecified error occurred.
                </p>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <Button asChild className="w-full btn-cta-primary">
                  <Link href="/auth/login">Try Login Again</Link>
                </Button>
                <Button asChild variant="outline" className="w-full btn-cta">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
