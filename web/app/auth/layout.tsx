import { Navigation } from '@/components/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation showAppLinks={false} sticky={true} />
      <main className="page-container main-content">{children}</main>
    </div>
  );
}
