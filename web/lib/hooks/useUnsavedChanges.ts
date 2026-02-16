'use client';

import { useEffect } from 'react';

/**
 * Warns the user before leaving the page when there are unsaved changes.
 * Handles both browser-level navigation (close, refresh, URL change) via
 * beforeunload, and client-side SPA navigation (Next.js Link clicks) via
 * a global click interceptor on anchor elements.
 */
export function useUnsavedChanges(hasUnsavedData: boolean) {
  // Browser-level: close tab, refresh, type new URL
  useEffect(() => {
    if (!hasUnsavedData) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedData]);

  // Client-side SPA navigation: intercept <a> clicks (Next.js Link)
  useEffect(() => {
    if (!hasUnsavedData) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      // Only intercept internal navigation links
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:'))
        return;

      // Skip if modifier keys (user intends to open in new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // Skip if target is _blank
      if (anchor.target === '_blank') return;

      const confirmed = window.confirm(
        'You have unsaved changes in the problem form. Are you sure you want to leave?'
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Use capture phase to intercept before Next.js router handles it
    window.addEventListener('click', handleClick, true);
    return () => window.removeEventListener('click', handleClick, true);
  }, [hasUnsavedData]);

  // Browser back/forward button (popstate)
  useEffect(() => {
    if (!hasUnsavedData) return;

    const handlePopState = () => {
      const confirmed = window.confirm(
        'You have unsaved changes in the problem form. Are you sure you want to leave?'
      );
      if (!confirmed) {
        // Push the current URL back to cancel the navigation
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Push a state so we can detect back button
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasUnsavedData]);
}
