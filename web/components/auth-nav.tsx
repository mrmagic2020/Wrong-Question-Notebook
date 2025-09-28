'use client';

import Link from 'next/link';
import { NotebookPen } from 'lucide-react';

export function AuthNav() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="w-full max-w-6xl flex justify-between items-center p-3 px-6 text-sm">
        <div className="flex gap-2 items-center font-bold text-xl">
          <NotebookPen className="h-6 w-6 text-blue-600" />
          <Link href={'/'} className="text-gray-900 dark:text-white">
            Wrong Question Notebook
          </Link>
        </div>
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
