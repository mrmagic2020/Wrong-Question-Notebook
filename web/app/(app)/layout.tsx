// web/src/app/(app)/layout.tsx
import { Navigation } from '@/components/navigation';
import { AnnouncementBanner } from '@/components/announcement-banner';
import { OnboardingProvider } from '@/components/onboarding/onboarding-provider';
import { TimezoneSync } from '@/components/timezone-sync';
import { createClient } from '@/lib/supabase/server';
import '@/app/globals.css';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let showOnboarding = false;
  let currentTimezone: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed_at, timezone')
        .eq('id', user.id)
        .single();

      showOnboarding = profile?.onboarding_completed_at === null;
      currentTimezone = profile?.timezone ?? null;
    }
  } catch {
    // If fetching fails, don't show onboarding
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/80 via-white to-rose-50/50 dark:from-stone-950 dark:via-stone-950 dark:to-stone-950">
      <TimezoneSync currentTimezone={currentTimezone} />
      <AnnouncementBanner />
      <Navigation showAppLinks={true} sticky={true} />
      <OnboardingProvider showOnboarding={showOnboarding}>
        <main className="page-container main-content">{children}</main>
      </OnboardingProvider>
    </div>
  );
}
