import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Öffentliche Routen, die keine Authentifizierung benötigen
const publicRoutes = ['/login', '/register', '/forgot-password', '/api/auth'];

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // API-Routen überspringen
  if (pathname.startsWith('/api/')) {
    return res;
  }

  // Statische Assets überspringen
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname === '/favicon.ico') {
    return res;
  }

  // Response Headers für Sicherheit setzen
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};