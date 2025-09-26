// web/src/app/(app)/layout.tsx
import Link from 'next/link';
import '@/app/globals.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <nav className="mx-auto max-w-5xl flex items-center justify-between p-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold">
              Wrong-Question Notebook
            </Link>
            <Link
              href="/subjects"
              className="text-sm text-gray-700 hover:text-black"
            >
              Subjects
            </Link>
            <Link
              href="/tags"
              className="text-sm text-gray-700 hover:text-black"
            >
              Tags
            </Link>
            <Link
              href="/problems"
              className="text-sm text-gray-700 hover:text-black"
            >
              Problems
            </Link>
          </div>
          <div className="text-xs text-gray-500">beta</div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
