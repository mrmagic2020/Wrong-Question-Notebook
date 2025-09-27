// web/src/app/(app)/layout.tsx
import Link from 'next/link';
import { AuthButton } from '@/components/auth-button';
import { NotebookPen } from 'lucide-react';
import '@/app/globals.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-b-foreground/10 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <nav className="w-full flex justify-center">
          <div className="w-full max-w-6xl flex justify-between items-center p-3 px-6 text-sm">
            <div className="flex items-center gap-6">
              <div className="flex gap-2 items-center font-bold text-xl">
                <NotebookPen className="h-6 w-6 text-blue-600" />
                <Link href="/" className="text-gray-900 dark:text-white">
                  Wrong Question Notebook
                </Link>
              </div>
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
            </div>
            <AuthButton />
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
