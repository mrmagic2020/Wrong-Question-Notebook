'use client';

import Link from 'next/link';
import { WLogo } from '@/components/w-logo';

export function AuthNav() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="w-full max-w-6xl flex justify-between items-center p-3 px-6 text-sm">
        <Link
          href="/"
          aria-label="Wrong Question Notebook"
          className="group flex items-baseline gap-0 font-bold text-xl text-gray-900 dark:text-white"
        >
          <WLogo className="h-7 w-7 text-amber-600 dark:text-amber-400 self-center shrink-0 transition-transform group-hover:scale-110" />
          <span className="-ml-0.5">rong Question Notebook</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </nav>
  );
}
