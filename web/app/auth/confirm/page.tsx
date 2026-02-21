'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { type EmailOtpType } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

function LoadingSpinner() {
  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <div className="w-full auth-fade-in">
          <div className="auth-card-amber">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verifying your link...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const next = searchParams.get('next') ?? '/';
    const safePath = next.startsWith('/') ? next : `/${next}`;

    if (!tokenHash || !type) {
      router.replace('/auth/error?error=No token hash or type');
      return;
    }

    const supabase = createClient();

    supabase.auth
      .verifyOtp({ type, token_hash: tokenHash })
      .then(({ error }) => {
        if (error) {
          router.replace(
            `/auth/error?error=${encodeURIComponent(error.message)}`
          );
        } else {
          router.replace(safePath);
        }
      });
  }, [searchParams, router]);

  return <LoadingSpinner />;
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ConfirmHandler />
    </Suspense>
  );
}
