export { middleware, proxy, default } from '../middleware.js';

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
