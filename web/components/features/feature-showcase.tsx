'use client';

import { useEffect, useRef } from 'react';

export function FeatureShowcase({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      // Make everything visible immediately
      const elements = containerRef.current?.querySelectorAll('[data-animate]');
      elements?.forEach(el => {
        (el as HTMLElement).style.opacity = '1';
      });
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const animation = el.dataset.animate;
            if (animation) {
              el.classList.add(animation);
            }
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = containerRef.current?.querySelectorAll('[data-animate]');
    elements?.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
