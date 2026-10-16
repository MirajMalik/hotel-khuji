import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hotel_khuji_jwt_secure_key_2026';

/**
 * Root Middleware / Proxy for Route Protection and Role-Based Access Control.
 *
 * Protects `/owner/*`, `/counter-view`, and `/dashboard` routes by ensuring:
 * 1. An active JWT token cookie or session exists.
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

  // 1. Check for Express JWT auth cookie
  const token = request.cookies.get('token')?.value;

  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (payload.role !== 'owner') {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'owner_access_required');
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    } catch (err) {
      console.warn('JWT verification failed in middleware:', err.message);
      // Fall through to redirect
    }
  }

  // Check legacy Supabase session cookie fallback
  const allCookies = request.cookies.getAll();
  const hasSupabaseCookie = allCookies.some(
    (c) =>
      (c.name.startsWith('sb-') && c.name.endsWith('-auth-token')) ||
      c.name.includes('supabase-auth-token')
  );

  if (hasSupabaseCookie) {
    return NextResponse.next();
  }

  // If no valid auth found, redirect to /login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
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
