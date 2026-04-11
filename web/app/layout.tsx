import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { ConsentProvider } from '@/components/cookie-consent/consent-provider';
import { ConditionalAnalytics } from '@/components/cookie-consent/conditional-analytics';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import './globals.css';

const defaultUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return {
    metadataBase: new URL(defaultUrl),
    title: `${t('siteName')} – ${t('siteDescription')}`,
    description: t('siteFullDescription'),
  };
}

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations('Common');

  // Only pass root-level messages to avoid duplicating the full bundle
  // (the [locale] layout's provider supplies the complete set)
  const rootMessages = {
    CookieConsent: (messages as { CookieConsent: Record<string, string> })
      .CookieConsent,
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <a href="#main-content" className="skip-link">
          {t('skipToMainContent')}
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={rootMessages}>
            <ConsentProvider>
              {children}
              <ConditionalAnalytics />
            </ConsentProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        <Toaster />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent layout shift by ensuring scrollbar space is always reserved
              (function() {
                // Calculate scrollbar width
                function getScrollbarWidth() {
                  const outer = document.createElement('div');
                  outer.style.visibility = 'hidden';
                  outer.style.overflow = 'scroll';
                  outer.style.msOverflowStyle = 'scrollbar';
                  document.body.appendChild(outer);
                  
                  const inner = document.createElement('div');
                  outer.appendChild(inner);
                  
                  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
                  outer.parentNode.removeChild(outer);
                  
                  return scrollbarWidth;
                }
                
                // Apply scrollbar compensation
                function applyScrollbarCompensation() {
                  const scrollbarWidth = getScrollbarWidth();
                  if (scrollbarWidth > 0) {
                    document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
                  }
                }
                
                // Run on load and resize
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', applyScrollbarCompensation);
                } else {
                  applyScrollbarCompensation();
                }
                
                window.addEventListener('resize', applyScrollbarCompensation);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
