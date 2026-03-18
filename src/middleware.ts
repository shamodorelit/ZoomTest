import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// JWT verification without Node.js crypto (Edge Runtime compatible)
function verifyJwtEdge(token: string, secret: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const protectedPaths = ['/admin', '/meeting', '/meetings'];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  const isAuthPage = pathname.startsWith('/login');

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const decoded = verifyJwtEdge(token, process.env.JWT_SECRET || 'secret');
    if (!decoded) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/admin') && decoded.role !== 'admin') {
      return NextResponse.redirect(new URL('/meetings', request.url));
    }
  }

  if (isAuthPage && token) {
    const decoded = verifyJwtEdge(token, process.env.JWT_SECRET || 'secret');
    if (decoded) {
      return NextResponse.redirect(new URL(decoded.role === 'admin' ? '/admin' : '/meetings', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/meeting/:path*', '/meetings/:path*', '/login'],
};
