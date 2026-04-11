'use client';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
import { useRef, useState } from 'react';
import { ERROR_MESSAGES, CAPTCHA_CONSTANTS } from '@/lib/constants';
import { KeyRound, Mail } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useTranslations } from 'next-intl';

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const t = useTranslations('Auth');
  const tCommon = useTranslations('Common');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(
    undefined
  );
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileInstance>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
        captchaToken,
      });
      if (error) throw error;
      setSuccess(true);
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
            <h1 className="auth-title">{t('checkYourEmailSuccess')}</h1>
            <p className="auth-subtitle">{t('resetInstructionsSent')}</p>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
            {t('resetDescription')}
          </p>

          {/* Back to Login */}
          <Button asChild className="w-full btn-cta">
            <Link href="/auth/login">{t('login')}</Link>
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
            <h1 className="auth-title">{t('resetYourPassword')}</h1>
            <p className="auth-subtitle">{t('enterEmailReset')}</p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleForgotPassword}
            className="auth-slide-up space-y-4"
          >
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
                    {tCommon('tryAgain')}
                  </button>
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full btn-cta-primary"
              disabled={isLoading || !captchaToken}
            >
              {isLoading ? t('sending') : t('sendResetEmail')}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('rememberPassword')}{' '}
            <Link href="/auth/login" className="auth-link-rose underline">
              {t('login')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
