import Link from 'next/link';
import { ProfileButton } from '@/components/profile-button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { WLogo } from '@/components/w-logo';
import { hasEnvVars } from '@/lib/server-utils';
import { AppNavLinks } from '@/components/app-nav-links';

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

  return (
    <nav
      className={`w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${stickyClass} ${className}`}
    >
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            aria-label="Wrong Question Notebook"
            className="group flex items-baseline gap-0 text-lg font-bold tracking-tight text-foreground"
          >
            <WLogo className="h-7 w-7 text-amber-600 dark:text-amber-400 self-center shrink-0 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline text-lg -ml-0.5">
              rong Question Notebook
            </span>
            <span className="sm:hidden text-lg -ml-0.5">QN</span>
          </Link>

          {showAppLinks ? <AppNavLinks /> : null}
        </div>

        <div className="flex items-center gap-3">
          {hasEnvVars && <ProfileButton />}
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
