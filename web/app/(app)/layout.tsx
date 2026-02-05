// web/src/app/(app)/layout.tsx
import { Navigation } from '@/components/navigation';
import '@/app/globals.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.14),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.12),transparent_55%)]" />
      <Navigation showAppLinks={true} sticky={true} />
      <main className="page-container main-content">{children}</main>
    </div>
  );
}
