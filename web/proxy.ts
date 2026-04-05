import { createServerClient } from '@supabase/ssr';
import createNextIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import {
  NextResponse,
  NextRequest,
  type NextRequest as NextRequestType,
} from 'next/server';
import { hasEnvVars } from '@/lib/server-utils';
import { updateLastLoginEdge } from '@/lib/edge-utils';
import { ENV_VARS, USER_ROLES } from '@/lib/constants';

const intlMiddleware = createNextIntlMiddleware(routing);

/** Strip locale prefix from pathname to get the "original" path */
function stripLocaleFromPath(pathname: string): string {
  for (const locale of routing.locales) {
    const prefix = `/${locale}`;
    if (pathname.startsWith(prefix)) {
      const stripped = pathname.slice(prefix.length);
      return stripped || '/';
    }
  }
  return pathname;
}

/** Get user from request using Supabase SSR client */
async function getUserFromRequest(request: NextRequestType) {
  if (!hasEnvVars) return null;

  try {
    const supabase = createServerClient(
      process.env[ENV_VARS.SUPABASE_URL]!,
      process.env[ENV_VARS.SUPABASE_ANON_KEY]!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Read-only for this proxy
          },
        },
      }
    );
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

/** Check if user has admin role */
async function checkAdminRole(userId: string) {
  if (!process.env[ENV_VARS.SUPABASE_SERVICE_ROLE_KEY]) return false;

  try {
    const serviceSupabase = createServerClient(
      process.env[ENV_VARS.SUPABASE_URL]!,
      process.env[ENV_VARS.SUPABASE_SERVICE_ROLE_KEY]!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // No-op for service role
          },
        },
      }
    );

    const { data: profile } = await serviceSupabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', userId)
      .single();

    return (
      profile &&
      [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(profile.user_role)
    );
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const originalPathname = request.nextUrl.pathname;

  // Step 0: API routes should NOT go through intlMiddleware at all
  // API routes are handled directly and should never have locale prefix
  // Skip to API processing directly to avoid redirect loops
  if (originalPathname.startsWith('/api/')) {
    // For API routes, we only need to check auth (if required)
    // and let the request proceed to the API route handler
    return NextResponse.next();
  }

  // Step 1: Handle i18n routing (only for non-API routes)
  let locale = routing.defaultLocale;

  const intlResponse = await intlMiddleware(request);

  // If intlMiddleware returned a redirect, pass it through
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return NextResponse.redirect(
      new URL(
        intlResponse.headers.get('location') || `/${routing.defaultLocale}`,
        request.url
      ),
      { status: intlResponse.status as 307 | 308 }
    );
  }

  // Get locale from header or URL
  const localeHeader = intlResponse.headers.get('x-next-intl-locale');
  if (localeHeader && (localeHeader === 'en' || localeHeader === 'zh-CN')) {
    locale = localeHeader;
  } else {
    // Check URL for locale
    for (const l of routing.locales) {
      if (originalPathname.startsWith(`/${l}`)) {
        locale = l;
        break;
      }
    }
  }

  // Strip locale to get the "content" path
  const contentPath = stripLocaleFromPath(originalPathname);

  // Step 2: Check auth state
  const user = await getUserFromRequest(request);

  // Step 3: Handle admin routes
  if (contentPath.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/${locale}/auth/login`, request.url)
      );
    }

    const isAdmin = await checkAdminRole(user.id);
    if (!isAdmin) {
      return NextResponse.redirect(new URL(`/${locale}/subjects`, request.url));
    }

    // Admin user accessing admin route - allow through
    return NextResponse.next();
  }

  // Step 4: Public paths check
  const publicPaths = ['/auth', '/privacy', '/upload'];

  const apiPublicPaths = [
    '/api/problem-sets',
    '/api/files',
    '/api/problems',
    '/api/qr-upload',
    '/api/cron/generate-digests',
  ];

  const isPublicPath = publicPaths.some(p => contentPath.startsWith(p));
  const isApiPublicPath = apiPublicPaths.some(p => contentPath.startsWith(p));

  // Auth pages are always public
  if (contentPath.startsWith('/auth')) {
    return NextResponse.next();
  }

  // API paths are checked separately
  if (isApiPublicPath) {
    return NextResponse.next();
  }

  // Other public pages
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Step 5: Protected routes - redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);

    // Only add redirect for non-root paths
    if (contentPath !== '/') {
      loginUrl.searchParams.set('redirect', contentPath);
    }

    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, allow through
  // Update last login if needed
  if (user.id) {
    try {
      const supabase = createServerClient(
        process.env[ENV_VARS.SUPABASE_URL]!,
        process.env[ENV_VARS.SUPABASE_ANON_KEY]!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {
              // Read-only
            },
          },
        }
      );
      const {
        data: { session },
      } = await supabase.auth.getSession();
      updateLastLoginEdge(
        user.id,
        process.env[ENV_VARS.SUPABASE_URL]!,
        process.env[ENV_VARS.SUPABASE_ANON_KEY]!,
        session?.access_token
      ).catch(() => {});
    } catch {
      // Ignore errors
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|txt)$).*)',
  ],
};
