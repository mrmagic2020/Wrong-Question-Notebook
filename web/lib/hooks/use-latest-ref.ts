'use client';

import { useRef } from 'react';

/**
 * Returns a ref that always holds the latest value.
 * Useful for avoiding stale closures in callbacks/effects.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
