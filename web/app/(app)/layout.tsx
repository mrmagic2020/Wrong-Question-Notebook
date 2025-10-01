// web/src/app/(app)/layout.tsx
import { Navigation } from '@/components/navigation';
import '@/app/globals.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation showAppLinks={true} sticky={true} />
      <main className="page-container main-content">{children}</main>
    </div>
  );
}
