'use client';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';
import { ERROR_MESSAGES } from '@/lib/constants';
import { KeyRound, Mail } from 'lucide-react';

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('w-full auth-fade-in', className)} {...props}>
      {success ? (
        <div className="auth-card-rose">
          {/* Icon header */}
          <div className="flex justify-center mb-6 auth-icon-entrance">
            <div className="auth-icon-box-rose">
              <Mail className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6 space-y-2">
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">Password reset instructions sent</p>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
            If you registered using your email and password, you will receive a
            password reset email.
          </p>

          {/* Back to Login */}
          <Button asChild className="w-full btn-cta">
            <Link href="/auth/login">Back to Login</Link>
          </Button>
        </div>
      ) : (
        <div className="auth-card-rose">
          {/* Icon header */}
          <div className="flex justify-center mb-6 auth-icon-entrance">
            <div className="auth-icon-box-rose">
              <KeyRound className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6 space-y-2">
            <h1 className="auth-title">Reset your password</h1>
            <p className="auth-subtitle">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleForgotPassword}
            className="auth-slide-up space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <Button
              type="submit"
              className="w-full btn-cta-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send reset email'}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{' '}
            <Link href="/auth/login" className="auth-link-rose underline">
              Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
