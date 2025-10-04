import Link from 'next/link';
import { AuthButton } from '@/components/auth-button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotebookPen } from 'lucide-react';
import { hasEnvVars } from '@/lib/server-utils';

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
      className={`w-full flex justify-center border-b border-b-foreground/10 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm ${stickyClass} ${className}`}
    >
      <div className="w-full max-w-7xl flex justify-between items-center p-3 px-6 text-sm">
        <div className="flex items-center gap-6">
          <div className="flex gap-2 items-center font-bold text-xl">
            <NotebookPen className="h-6 w-6 text-blue-600" />
            <Link href="/" className="text-gray-900 dark:text-white">
              Wrong Question Notebook
            </Link>
          </div>
          {showAppLinks && (
            <>
              <Link
                href="/subjects"
                className="text-sm text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
              >
                Subjects
              </Link>
              <Link
                href="/tags"
                className="text-sm text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
              >
                Tags
              </Link>
              <Link
                href="/problems"
                className="text-sm text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
              >
                Problems
              </Link>
              <Link
                href="/problem-sets"
                className="text-sm text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white"
              >
                Problem Sets
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {hasEnvVars && <AuthButton />}
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
