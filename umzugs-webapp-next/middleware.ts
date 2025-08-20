import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/supabase-js';

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
  if (pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return res;
  }

  // Favicon überspringen
  if (pathname === '/favicon.ico') {
    return res;
  }

  // Sprache aus der URL extrahieren
  const locale = pathname.split('/')[1];
  const supportedLocales = ['de', 'en'];
  
  // Wenn keine Sprache in der URL, auf Deutsch umleiten
  if (!supportedLocales.includes(locale)) {
    const newUrl = new URL(`/de${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Authentifizierung prüfen für geschützte Routen
  const isPublicRoute = publicRoutes.some(route => pathname.includes(route));
  
  if (!isPublicRoute) {
    try {
      // Supabase Client für Middleware erstellen
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase environment variables not configured');
        return res;
      }

      const supabase = createMiddlewareClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            get: (name: string) => {
              const cookie = request.cookies.get(name);
              return cookie?.value;
            },
            set: (name: string, value: string) => {
              res.cookies.set({
                name,
                value,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              });
            },
            remove: (name: string) => {
              res.cookies.set({
                name,
                value: '',
                maxAge: 0,
              });
            },
          },
        }
      );

      // Session prüfen
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Nicht authentifiziert - zur Login-Seite umleiten
        const redirectUrl = new URL(`/${locale}/login`, request.url);
        redirectUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Benutzerrolle prüfen (optional)
      const userRole = session.user?.user_metadata?.role;
      
      // Admin-Routen schützen
      if (pathname.includes('/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
      }
    } catch (error) {
      console.error('Middleware authentication error:', error);
      // Bei Fehlern weitermachen
      return res;
    }
  }

  // Response Headers für Sicherheit setzen
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
  ].join('; ');
  
  res.headers.set('Content-Security-Policy', csp);

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