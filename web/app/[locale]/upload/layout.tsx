import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Upload');
  return {
    title: `${t('title')} – Wrong Question Notebook`,
    description: t('captureDescription'),
    robots: 'noindex, nofollow',
  };
}

export default async function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <main
      id="main-content"
      lang={locale}
      className="min-h-dvh bg-gradient-to-b from-amber-50/80 via-white to-rose-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900"
    >
      {children}
    </main>
  );
}
