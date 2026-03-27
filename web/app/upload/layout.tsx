import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload Photo – Wrong Question Notebook',
  description: 'Capture a photo of your problem and send it to your desktop.',
  robots: 'noindex, nofollow',
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="min-h-dvh bg-gradient-to-b from-amber-50/80 via-white to-rose-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {children}
    </main>
  );
}
