'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const CONTENT_FADE_SPEED = 1.5; // fully faded by ~67% scroll
const INDICATOR_FADE_SPEED = 4; // fully faded by ~25% scroll
const SCROLL_TRANSLATE_DISTANCE = 60; // px content shifts up at full scroll

interface HeroScrollProps {
  children: ReactNode;
}

export function HeroScroll({ children }: HeroScrollProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    let ticking = false;
    let indicatorDismissed = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const section = sectionRef.current;
        const content = contentRef.current;
        const indicator = indicatorRef.current;
        if (!section || !content) {
          ticking = false;
          return;
        }

        const sectionHeight = section.offsetHeight;
        const scrollY = window.scrollY;
        // Progress from 0 (top) to 1 (scrolled past hero)
        const progress = Math.min(1, Math.max(0, scrollY / sectionHeight));

        // Content: translate up and fade out
        const translateY = progress * -SCROLL_TRANSLATE_DISTANCE;
        const opacity = 1 - progress * CONTENT_FADE_SPEED;
        content.style.transform = `translateY(${translateY}px)`;
        content.style.opacity = `${Math.max(0, opacity)}`;

        // Indicator: fade with scroll, permanently hide once fully faded
        if (indicator) {
          if (!indicatorDismissed) {
            const indicatorOpacity = 1 - progress * INDICATOR_FADE_SPEED;
            indicator.style.opacity = `${Math.max(0, indicatorOpacity)}`;
            if (indicatorOpacity <= 0) {
              indicatorDismissed = true;
              indicator.style.visibility = 'hidden';
            }
          }
        }

        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="min-h-[calc(100dvh-4rem)] flex flex-col px-6"
    >
      {/* Top spacer — pushes content to ~1/3 from top */}
      <div className="flex-[1]" />

      <div ref={contentRef} className="will-change-[transform,opacity]">
        {children}
      </div>

      {/* Bottom spacer — 2x top to position content at 1/3 */}
      <div className="flex-[1.5] flex flex-col justify-end items-center">
        <div
          ref={indicatorRef}
          className="flex flex-col items-center gap-2 pb-6 animate-bounce-subtle"
        >
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 tracking-wide uppercase">
            Scroll to explore
          </span>
          <svg
            className="w-5 h-5 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
