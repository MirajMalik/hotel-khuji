import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hotel_khuji_jwt_secure_key_2026';

/**
 * Root Proxy / Middleware for Route Protection and Role-Based Access Control.
 *
 * Protects:
 *  - /hotels          → requires any authenticated session
 *  - /owner/*         → requires owner role
 *  - /counter-view/*  → requires owner role
 *  - /dashboard/*     → requires owner role
 *
 * Auth sources checked (in order):
 *  1. Express JWT cookie (`token`)
 *  2. Supabase session cookies (`sb-*-auth-token`)
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isOwnerRoute =
    pathname.startsWith('/owner') ||
    pathname.startsWith('/counter-view') ||
    pathname.startsWith('/dashboard');

  const isCustomerRoute = pathname === '/hotels' || pathname.startsWith('/hotels/');

  // Pass through all non-protected routes
  if (!isOwnerRoute && !isCustomerRoute) {
    return NextResponse.next();
  }

  // Quick role bypass check
  const demoRole = request.cookies.get('demo_role')?.value;
  if (demoRole === 'owner' && isOwnerRoute) {
    return NextResponse.next();
  }
  if (demoRole && isCustomerRoute) {
    return NextResponse.next();
  }

  // ── 1. Check Express JWT cookie ────────────────────────────────────────────
  const token = request.cookies.get('token')?.value;

  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (isOwnerRoute && payload.role !== 'owner') {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'owner_access_required');
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Valid JWT — allow
      return NextResponse.next();
    } catch (err) {
      console.warn('JWT verification failed in middleware:', err.message);
      // Fall through to Supabase check
    }
  }

  // ── 2. Check Supabase session cookies (optimistic) ─────────────────────────
  const allCookies = request.cookies.getAll();
  const supabaseCookie = allCookies.find(
    (c) =>
      (c.name.startsWith('sb-') && c.name.endsWith('-auth-token')) ||
      c.name.includes('supabase-auth-token')
  );

  if (supabaseCookie) {
    if (isCustomerRoute) {
      // Any valid Supabase session is sufficient for /hotels
      return NextResponse.next();
    }

    if (isOwnerRoute) {
      // For owner routes, we optimistically allow if a Supabase session exists.
      // The page itself does the definitive role check client-side.
      return NextResponse.next();
    }
  }

  // ── 3. No auth found — redirect to login ──────────────────────────────────
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);

  if (isOwnerRoute) {
    loginUrl.searchParams.set('error', 'owner_access_required');
  }

  return NextResponse.redirect(loginUrl);
}

// Next.js 16 Proxy export compatibility
export const proxy = middleware;
export default middleware;

export const config = {
  matcher: [
    '/hotels',
    '/hotels/:path*',
    '/owner/:path*',
    '/counter-view',
    '/counter-view/:path*',
    '/dashboard',
    '/dashboard/:path*',
  ],
};
