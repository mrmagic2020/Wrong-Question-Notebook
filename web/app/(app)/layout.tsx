// web/src/app/(app)/layout.tsx
import { Navigation } from '@/components/navigation';
import '@/app/globals.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation showAppLinks={true} sticky={true} />
      <main className="mx-auto max-w-6xl p-6 main-content">{children}</main>
    </div>
  );
}
