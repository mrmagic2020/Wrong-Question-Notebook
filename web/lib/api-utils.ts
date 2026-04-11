/**
 * Get the base URL for API requests
 * In Next.js App Router with [locale] routing, we need to ensure API calls
 * go to /api/ not /[locale]/api/
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Server-side fallback
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Build a full API URL
 * Ensures API paths work correctly in both locale and non-locale contexts
 */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/${cleanPath}`;
}
