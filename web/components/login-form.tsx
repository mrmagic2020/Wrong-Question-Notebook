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
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

interface LoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  redirectTo?: string;
}

export function LoginForm({ className, redirectTo, ...props }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(
    undefined
  );
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaReady, setCaptchaReady] = useState(false);
  const captchaRef = useRef<TurnstileInstance>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });
      if (error) throw error;
      // Redirect to intended destination or subjects page after successful login
      const destination = redirectTo || ROUTES.SUBJECTS;
      router.push(destination);
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
      <div className="auth-card-amber">
        {/* Icon header */}
        <div className="flex justify-center mb-6 auth-icon-entrance">
          <div className="auth-icon-box-amber">
            <LogIn className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6 space-y-2">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">
            Enter your credentials to access your notebook
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="auth-slide-up space-y-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/forgot-password"
                className="auth-link text-sm underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="flex flex-col items-center gap-1">
            <Turnstile
              ref={captchaRef}
              siteKey={CAPTCHA_CONSTANTS.TURNSTILE_SITE_KEY}
              onSuccess={token => {
                setCaptchaToken(token);
                setCaptchaError(null);
                setCaptchaReady(true);
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
            className={`w-full btn-cta-primary${captchaReady ? ' captcha-ready-glow' : ''}`}
            disabled={isLoading || !captchaToken}
            onAnimationEnd={() => setCaptchaReady(false)}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/auth/sign-up" className="auth-link underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
