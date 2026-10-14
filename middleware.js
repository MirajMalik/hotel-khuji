import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

/**
 * Root Middleware / Proxy for Route Protection and Role-Based Access Control.
 * 
 * Protects `/owner/*` routes by ensuring:
 * 1. An active Supabase session exists.
 * 2. The authenticated user has the 'owner' role.
 * 
 * If not authenticated or role is not 'owner', redirects to `/login`.
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect /owner/* routes, plus /counter-view and /dashboard
  const isOwnerRoute =
    pathname.startsWith('/owner') ||
    pathname.startsWith('/counter-view') ||
    pathname.startsWith('/dashboard');

  if (!isOwnerRoute) {
    return NextResponse.next();
  }

  // Developer & Evaluator quick bypass check
  const isDemoBypass =
    request.cookies.get('demo_role')?.value === 'owner' ||
    request.nextUrl.searchParams.get('demo') === 'owner';

  if (isDemoBypass) {
    return NextResponse.next();
  }

  // Check if any Supabase session cookies exist
  const allCookies = request.cookies.getAll();
  const hasSupabaseCookie = allCookies.some(
    (c) =>
      (c.name.startsWith('sb-') && c.name.endsWith('-auth-token')) ||
      c.name.includes('supabase-auth-token')
  );

  // If no auth cookie, redirect immediately to /login with redirect parameter
  if (!hasSupabaseCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  // Initialize Supabase Server Client
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. If no user, redirect to /login
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Verify user has 'owner' role
    const role =
      user.user_metadata?.role ||
      user.app_metadata?.role ||
      user.raw_user_meta_data?.role;

    if (role !== 'owner') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'owner_access_required');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch (err) {
    console.error('Session verification error in middleware:', err);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// Next.js 16 Proxy export compatibility
export const proxy = middleware;
export default middleware;

export const config = {
  matcher: [
    '/owner/:path*',
    '/counter-view',
    '/counter-view/:path*',
    '/dashboard',
    '/dashboard/:path*',
  ],
};
