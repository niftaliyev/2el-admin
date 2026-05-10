import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // Define public routes (auth pages)
  const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/signup');

  // If user is on an auth page but is already logged in, redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is NOT on an auth page and NOT logged in, redirect to signin
  if (!isAuthPage && !token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - banner.png (specific image)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|banner.png).*)',
  ],
};
