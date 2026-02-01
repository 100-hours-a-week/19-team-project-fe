import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

const isAllowedPath = (pathname: string) => {
  if (pathname === '/') return true;
  if (pathname === '/experts') return true;
  if (pathname.startsWith('/experts/')) return true;

  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/api')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname === '/robots.txt') return true;
  if (pathname === '/sitemap.xml') return true;
  if (pathname === '/manifest.webmanifest') return true;

  return false;
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isAllowedPath(pathname)) {
    return NextResponse.next();
  }
  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.set('guard', 'invalid');
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: '/:path*',
};
