import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasEnvVars } from '../server-utils';
import { updateLastLoginEdge } from '../edge-utils';
import { ENV_VARS, USER_ROLES, ROUTES } from '../constants';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Update last login timestamp for authenticated users
  if (user && user.sub) {
    try {
      // Get the user's JWT token from the session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userToken = session?.access_token;

      // Use Edge Runtime compatible approach to update last login
      updateLastLoginEdge(
        user.sub,
        process.env[ENV_VARS.SUPABASE_URL]!,
        process.env[ENV_VARS.SUPABASE_ANON_KEY]!,
        userToken
      ).catch(console.warn);
    } catch {
      // Ignore errors in login tracking
    }
  }

  // Check if user is trying to access admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Redirect to login if not authenticated
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.AUTH.LOGIN;
      return NextResponse.redirect(url);
    }

    // Check if user has admin privileges using service role
    try {
      // Validate service role key exists
      if (!process.env[ENV_VARS.SUPABASE_SERVICE_ROLE_KEY]) {
        console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
        const url = request.nextUrl.clone();
        url.pathname = ROUTES.SUBJECTS;
        return NextResponse.redirect(url);
      }

      // Create a service role client to bypass RLS
      const serviceSupabase = createServerClient(
        process.env[ENV_VARS.SUPABASE_URL]!,
        process.env[ENV_VARS.SUPABASE_SERVICE_ROLE_KEY]!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
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
        .eq('id', user.sub)
        .single();

      if (
        !profile ||
        ![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(profile.user_role)
      ) {
        // Redirect to subjects page if not admin
        const url = request.nextUrl.clone();
        url.pathname = ROUTES.SUBJECTS;
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // If there's an error checking profile, redirect to subjects
      console.warn('Admin check error:', error);
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.SUBJECTS;
      return NextResponse.redirect(url);
    }
  }

  // Allow authenticated users to access the homepage
  // (Removed automatic redirect to /subjects)

  if (
    request.nextUrl.pathname !== '/' &&
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const loginUrl = new URL(ROUTES.AUTH.LOGIN, request.url);
    loginUrl.searchParams.set(
      'redirect',
      request.nextUrl.pathname + request.nextUrl.search
    );
    const res = NextResponse.redirect(loginUrl, { status: 302 });
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('Vary', 'Cookie, Authorization, User-Agent, Accept-Language');
    return res;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
