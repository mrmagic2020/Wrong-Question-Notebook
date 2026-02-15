import { Navigation } from '@/components/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-page-bg">
      <Navigation showAppLinks={false} sticky={true} />
      {children}
    </div>
  );
}
