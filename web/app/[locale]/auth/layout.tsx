import { Navigation } from '@/components/navigation';

interface LocaleAuthLayoutProps {
  children: React.ReactNode;
}

export default function LocaleAuthLayout({ children }: LocaleAuthLayoutProps) {
  return (
    <div className="auth-page-bg">
      <Navigation showAppLinks={false} sticky={true} />
      <main id="main-content">{children}</main>
    </div>
  );
}
