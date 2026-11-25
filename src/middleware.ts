import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isLoginPage = pathname === '/login';

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token && isLoginPage) {
    const dest = token.role === 'ADMIN' ? '/dashboard' : '/pointage';
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (token && token.role === 'SECURITY') {
    const adminOnlyRoutes = ['/dashboard', '/employees', '/users', '/settings', '/reports'];
    if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/pointage', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};