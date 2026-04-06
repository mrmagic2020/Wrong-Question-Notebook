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
async function getUserFromRequest(
  request: NextRequestType,
  cookieUpdater: (cookies: any[]) => void
) {
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
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            cookieUpdater(cookiesToSet);
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
  let finalResponse: NextResponse;
  let cookiesToUpdate: any[] = [];

  // Step 0: API routes should NOT go through intlMiddleware at all
  if (originalPathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Step 1: Handle i18n routing
  let locale = routing.defaultLocale;
  const intlResponse = await intlMiddleware(request);

  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  // Next-Intl sets this on non-redirect responses
  finalResponse = intlResponse;

  const localeHeader = intlResponse.headers.get('x-next-intl-locale');
  if (localeHeader && (localeHeader === 'en' || localeHeader === 'zh-CN')) {
    locale = localeHeader;
  } else {
    for (const l of routing.locales) {
      if (originalPathname.startsWith(`/${l}`)) {
        locale = l;
        break;
      }
    }
  }

  const contentPath = stripLocaleFromPath(originalPathname);

  // Step 2: Check auth state
  const user = await getUserFromRequest(request, cookies => {
    cookiesToUpdate.push(...cookies);
  });

  // Apply collected cookies to any response returned from here on
  const applyCookies = (res: NextResponse) => {
    cookiesToUpdate.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
  };

  // Step 3: Handle admin routes
  if (contentPath.startsWith('/admin')) {
    if (!user) {
      return applyCookies(
        NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
      );
    }

    const isAdmin = await checkAdminRole(user.id);
    if (!isAdmin) {
      return applyCookies(
        NextResponse.redirect(new URL(`/${locale}/subjects`, request.url))
      );
    }

    return applyCookies(finalResponse);
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

  if (contentPath.startsWith('/auth') || isApiPublicPath || isPublicPath) {
    return applyCookies(finalResponse);
  }

  // Step 5: Protected routes - redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    if (contentPath !== '/') {
      loginUrl.searchParams.set('redirect', contentPath);
    }
    return applyCookies(NextResponse.redirect(loginUrl));
  }

  // User is authenticated
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
              // Read-only login heartbeat check
            },
          },
        }
      );
      const { data: { session } } = await supabase.auth.getSession();
      updateLastLoginEdge(
        user.id,
        process.env[ENV_VARS.SUPABASE_URL]!,
        process.env[ENV_VARS.SUPABASE_ANON_KEY]!,
        session?.access_token
      ).catch(() => {});
    } catch {
      // Ignore
    }
  }

  return applyCookies(finalResponse);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|txt)$).*)',
  ],
};
