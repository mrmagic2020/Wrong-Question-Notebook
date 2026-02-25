import Link from 'next/link';
import { ProfileButton } from '@/components/profile-button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotebookPen } from 'lucide-react';
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
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
          >
            <NotebookPen className="h-6 w-6 text-blue-600" />
            <span className="hidden sm:inline text-lg">
              Wrong Question Notebook
            </span>
            <span className="sm:hidden text-lg">WQN</span>
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
