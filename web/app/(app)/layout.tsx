// web/src/app/(app)/layout.tsx
import { Navigation } from '@/components/navigation';
import '@/app/globals.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/80 via-white to-rose-50/50 dark:from-stone-950 dark:via-stone-950 dark:to-stone-950">
      <Navigation showAppLinks={true} sticky={true} />
      <main className="page-container main-content">{children}</main>
    </div>
  );
}
