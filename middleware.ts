import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/access-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/share/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  if (await verifyAccessToken(request.cookies.get('finance_access')?.value)) {
    return NextResponse.next();
  }

  const response = NextResponse.redirect(new URL('/login', request.url));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
