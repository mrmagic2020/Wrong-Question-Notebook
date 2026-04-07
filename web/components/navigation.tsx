import { Link } from '@/i18n/navigation';
import { ProfileButton } from '@/components/profile-button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { WLogo } from '@/components/w-logo';
import { hasEnvVars } from '@/lib/server-utils';
import { AppNavLinks } from '@/components/app-nav-links';
import { useTranslations } from 'next-intl';

interface NavigationProps {
  showAppLinks?: boolean;
  className?: string;
  sticky?: boolean;
}

export function Navigation({
  showAppLinks = false,
  className = '',
  sticky = false,
}: NavigationProps) {
  const stickyClass = sticky ? 'sticky top-0 z-50' : '';
  const t = useTranslations('Common');

  return (
    <nav
      className={`w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${stickyClass} ${className}`}
    >
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            aria-label={t('appName')}
            className="group flex items-baseline gap-0 text-lg font-bold tracking-tight text-foreground"
          >
            <WLogo className="h-7 w-7 text-amber-600 dark:text-amber-400 self-center shrink-0 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline text-lg -ml-0.5">
              {t('logoText')}
            </span>
            <span className="sm:hidden text-lg -ml-0.5">{t('logoShortText')}</span>
          </Link>

          {showAppLinks ? <AppNavLinks /> : null}
        </div>

        <div className="flex items-center gap-3">
          {hasEnvVars && <ProfileButton />}
          <LocaleSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
