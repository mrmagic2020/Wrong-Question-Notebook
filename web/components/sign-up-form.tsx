'use client';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useEffect, useRef, useState } from 'react';
import { ROUTES, ERROR_MESSAGES, CAPTCHA_CONSTANTS } from '@/lib/constants';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api-utils';

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const t = useTranslations('Auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(
    undefined
  );
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaReady, setCaptchaReady] = useState(false);
  const captchaRef = useRef<TurnstileInstance>(null);
  const router = useRouter();

  useEffect(() => {
    if (!captchaReady) return;
    const timer = setTimeout(() => setCaptchaReady(false), 2200);
    return () => clearTimeout(timer);
  }, [captchaReady]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (!agreedToPrivacy) {
      setError(t('privacyPolicyRequired'));
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError(t('passwordsDoNotMatch'));
      setIsLoading(false);
      return;
    }

    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${ROUTES.SUBJECTS}`,
          captchaToken,
        },
      });
      if (error) throw error;

      // Auto-detect and set timezone for new user
      if (signUpData?.user) {
        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detectedTz) {
          fetch(apiUrl('/api/profile'), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timezone: detectedTz }),
          }).catch(() => {});
        }
      }

      router.push(`/auth/sign-up-success?email=${encodeURIComponent(email)}`);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
      );
      setCaptchaToken(undefined);
      captchaRef.current?.reset();
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
          <h1 className="auth-title">{t('createYourNotebook')}</h1>
          <p className="auth-subtitle">{t('startYourJourney')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="auth-slide-up space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
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
                aria-label={
                  showPassword ? t('hidePassword') : t('showPassword')
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="repeat-password">{t('repeatPassword')}</Label>
            <div className="relative">
              <Input
                id="repeat-password"
                type={showRepeatPassword ? 'text' : 'password'}
                required
                value={repeatPassword}
                onChange={e => setRepeatPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowRepeatPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={
                  showRepeatPassword ? t('hidePassword') : t('showPassword')
                }
              >
                {showRepeatPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
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
              {t('privacyPolicyAgreement')}{' '}
              <Link href="/privacy" className="auth-link underline">
                {t('privacyPolicy')}
              </Link>
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
                setCaptchaReady(true);
              }}
              onExpire={() => setCaptchaToken(undefined)}
              onError={() => {
                setCaptchaToken(undefined);
                setCaptchaError(t('securityVerificationFailed'));
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
                  {t('tryAgain')}
                </button>
              </p>
            )}
          </div>
          <Button
            type="submit"
            className={`w-full btn-cta-primary${captchaReady ? ' captcha-ready-glow' : ''}`}
            disabled={isLoading || !captchaToken}
          >
            {isLoading ? t('creatingAccount') : t('signUp')}
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/auth/login" className="auth-link underline">
            {t('login')}
          </Link>
        </div>
      </div>
    </div>
  );
}
