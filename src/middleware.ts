import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'caias-smart-attendance-super-secret-jwt-key-256bit-production'
);

const COOKIE_NAME = 'caias_auth_token';

interface TokenPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'FACULTY' | 'STUDENT';
  name: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files and internal paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let user: TokenPayload | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = payload as unknown as TokenPayload;
    } catch (err) {
      user = null;
    }
  }

  // Root path redirect
  if (pathname === '/') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (user.role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    if (user.role === 'FACULTY') return NextResponse.redirect(new URL('/faculty/dashboard', request.url));
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  // Login page access
  if (pathname === '/login') {
    if (user) {
      if (user.role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      if (user.role === 'FACULTY') return NextResponse.redirect(new URL('/faculty/dashboard', request.url));
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url));
    }
    if (user.role !== 'ADMIN') {
      const dest = user.role === 'FACULTY' ? '/faculty/dashboard' : '/student/dashboard';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  // Protected Faculty Routes
  if (pathname.startsWith('/faculty')) {
    if (!user) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url));
    }
    if (user.role !== 'FACULTY' && user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url));
    }
  }

  // Protected Student Routes
  if (pathname.startsWith('/student')) {
    if (!user) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url));
    }
    if (user.role !== 'STUDENT' && user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/faculty/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
