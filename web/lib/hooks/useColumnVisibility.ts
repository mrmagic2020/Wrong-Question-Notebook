'use client';

import { useState, useEffect, useCallback } from 'react';
import { VisibilityState } from '@tanstack/react-table';

interface UseColumnVisibilityOptions {
  storageKey: string;
  defaultVisibility?: VisibilityState;
}

/**
 * Custom hook to manage column visibility with session storage persistence.
 * The visibility state persists for the duration of the browser session.
 */
export function useColumnVisibility({
  storageKey,
  defaultVisibility = {},
}: UseColumnVisibilityOptions) {
  const [columnVisibility, setColumnVisibilityState] =
    useState<VisibilityState>(defaultVisibility);

  // Load column visibility from session storage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsedVisibility = JSON.parse(stored);
        setColumnVisibilityState(parsedVisibility);
      }
    } catch (error) {
      console.warn(
        `Failed to load column visibility from session storage for key "${storageKey}":`,
        error
      );
    }
  }, [storageKey]);

  // Save column visibility to session storage whenever it changes
  const setColumnVisibility = useCallback(
    (
      visibility: VisibilityState | ((prev: VisibilityState) => VisibilityState)
    ) => {
      setColumnVisibilityState(prev => {
        const newVisibility =
          typeof visibility === 'function' ? visibility(prev) : visibility;

        try {
          sessionStorage.setItem(storageKey, JSON.stringify(newVisibility));
        } catch (error) {
          console.warn(
            `Failed to save column visibility to session storage for key "${storageKey}":`,
            error
          );
        }

        return newVisibility;
      });
    },
    [storageKey]
  );

  // Reset to default visibility and clear from storage
  const resetColumnVisibility = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
      setColumnVisibilityState(defaultVisibility);
    } catch (error) {
      console.warn(
        `Failed to reset column visibility for key "${storageKey}":`,
        error
      );
    }
  }, [storageKey, defaultVisibility]);

  return {
    columnVisibility,
    setColumnVisibility,
    resetColumnVisibility,
  };
}
