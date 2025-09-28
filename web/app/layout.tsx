import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Wrong Question Notebook - Master Your Learning',
  description:
    'Organize problems by subject, track your progress, and build your knowledge systematically',
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster />
        <SpeedInsights />
        <Analytics />
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
