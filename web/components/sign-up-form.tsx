'use client';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ROUTES, ERROR_MESSAGES, CAPTCHA_CONSTANTS } from '@/lib/constants';
import { UserPlus } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(
    undefined
  );
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileInstance>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (!agreedToPrivacy) {
      setError('You must agree to the Privacy Policy to create an account.');
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${ROUTES.SUBJECTS}`,
          captchaToken,
        },
      });
      if (error) throw error;
      router.push(`/auth/sign-up-success?email=${encodeURIComponent(email)}`);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
      );
      setCaptchaToken(undefined);
      captchaRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('w-full auth-fade-in', className)} {...props}>
      <div className="auth-card-orange">
        {/* Icon header */}
        <div className="flex justify-center mb-6 auth-icon-entrance">
          <div className="auth-icon-box-orange">
            <UserPlus className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6 space-y-2">
          <h1 className="auth-title">Create your notebook</h1>
          <p className="auth-subtitle">
            Start organizing your learning journey
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="auth-slide-up space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repeat-password">Repeat Password</Label>
            <Input
              id="repeat-password"
              type="password"
              required
              value={repeatPassword}
              onChange={e => setRepeatPassword(e.target.value)}
            />
          </div>
          <div className="flex items-start gap-2">
            <input
              id="privacy-policy"
              type="checkbox"
              checked={agreedToPrivacy}
              onChange={e => setAgreedToPrivacy(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-orange-500"
            />
            <label
              htmlFor="privacy-policy"
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              I have read and agree to the{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="auth-link underline"
              >
                Privacy Policy
              </a>
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="flex flex-col items-center gap-1">
            <Turnstile
              ref={captchaRef}
              siteKey={CAPTCHA_CONSTANTS.TURNSTILE_SITE_KEY}
              onSuccess={token => {
                setCaptchaToken(token);
                setCaptchaError(null);
              }}
              onExpire={() => setCaptchaToken(undefined)}
              onError={() => {
                setCaptchaToken(undefined);
                setCaptchaError('Security verification failed.');
              }}
            />
            {captchaError && (
              <p className="form-error text-center">
                {captchaError}{' '}
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    setCaptchaError(null);
                    captchaRef.current?.reset();
                  }}
                >
                  Try again
                </button>
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full btn-cta-primary"
            disabled={isLoading || !captchaToken}
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="auth-link underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
