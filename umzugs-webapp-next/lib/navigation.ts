import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import type { Locale } from './i18n';

export const locales = ['de', 'en'] as const;
export const localePrefix = 'always';

// Typsichere Routen definieren
export const routes = {
  home: '/',
  dashboard: '/dashboard',
  customers: {
    list: '/customers',
    detail: (id: string) => `/customers/${id}` as const,
    new: '/customers/new',
    edit: (id: string) => `/customers/${id}/edit` as const,
  },
  quotes: {
    list: '/quotes',
    detail: (id: string) => `/quotes/${id}` as const,
    new: '/quotes/new',
    edit: (id: string) => `/quotes/${id}/edit` as const,
    pdf: (id: string) => `/quotes/${id}/pdf` as const,
  },
  calendar: '/calendar',
  documents: {
    list: '/documents',
    folder: (id: string) => `/documents/folder/${id}` as const,
    upload: '/documents/upload',
  },
  settings: {
    profile: '/settings/profile',
    company: '/settings/company',
    integrations: '/settings/integrations',
    billing: '/settings/billing',
    team: '/settings/team',
  },
  auth: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },
  admin: {
    dashboard: '/admin',
    users: '/admin/users',
    analytics: '/admin/analytics',
    system: '/admin/system',
  },
  api: {
    auth: {
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      session: '/api/auth/session',
    },
    customers: '/api/customers',
    quotes: '/api/quotes',
    documents: '/api/documents',
    lexware: {
      sync: '/api/lexware/sync',
      customers: '/api/lexware/customers',
      quotes: '/api/lexware/quotes',
    },
    email: {
      send: '/api/email/send',
      list: '/api/email/list',
      folders: '/api/email/folders',
    },
  },
} as const;

// Typ für alle Routen extrahieren
export type Routes = typeof routes;

// Navigation Hooks erstellen
export const { Link, redirect, usePathname, useRouter } = 
  createSharedPathnamesNavigation({ locales, localePrefix });

// Typsichere Link-Komponente
import NextLink from 'next/link';
import { ComponentProps } from 'react';

type TypedLinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  href: string | { pathname: string; query?: Record<string, string | number> };
  locale?: Locale;
};

export function TypedLink({ href, locale, ...props }: TypedLinkProps) {
  const finalHref = typeof href === 'string' 
    ? href 
    : `${href.pathname}${href.query ? `?${new URLSearchParams(href.query as any).toString()}` : ''}`;
  
  const localizedHref = locale ? `/${locale}${finalHref}` : finalHref;
  
  return <NextLink href={localizedHref} {...props} />;
}

// Utility functions für Navigation
export function getLocalizedRoute(route: string, locale: Locale): string {
  return `/${locale}${route}`;
}

export function extractLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/');
  const maybeLocale = segments[1];
  
  if (locales.includes(maybeLocale as Locale)) {
    return maybeLocale as Locale;
  }
  
  return null;
}

export function removeLocaleFromPathname(pathname: string): string {
  const locale = extractLocaleFromPathname(pathname);
  
  if (locale) {
    return pathname.replace(`/${locale}`, '') || '/';
  }
  
  return pathname;
}

// Breadcrumb Generator
export interface Breadcrumb {
  label: string;
  href: string;
  current?: boolean;
}

export function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const cleanPath = removeLocaleFromPathname(pathname);
  const segments = cleanPath.split('/').filter(Boolean);
  
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Home', href: routes.home },
  ];
  
  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Map segment to label
    let label = segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // Special cases
    if (segment === 'customers') label = 'Kunden';
    if (segment === 'quotes') label = 'Angebote';
    if (segment === 'documents') label = 'Dokumente';
    if (segment === 'settings') label = 'Einstellungen';
    if (segment === 'calendar') label = 'Kalender';
    
    breadcrumbs.push({
      label,
      href: currentPath,
      current: isLast,
    });
  });
  
  return breadcrumbs;
}

// Route Guards
export function isPublicRoute(pathname: string): boolean {
  const cleanPath = removeLocaleFromPathname(pathname);
  const publicRoutes = [
    routes.auth.login,
    routes.auth.register,
    routes.auth.forgotPassword,
    routes.auth.resetPassword,
  ];
  
  return publicRoutes.some(route => cleanPath.startsWith(route));
}

export function isAdminRoute(pathname: string): boolean {
  const cleanPath = removeLocaleFromPathname(pathname);
  return cleanPath.startsWith('/admin');
}

export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api');
}

// Route validation
export function isValidRoute(pathname: string): boolean {
  const cleanPath = removeLocaleFromPathname(pathname);
  
  // Check against all defined routes
  const allRoutes = getAllRoutes(routes);
  return allRoutes.some(route => {
    // Handle dynamic routes
    const routePattern = route.replace(/\[.*?\]/g, '.*');
    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(cleanPath);
  });
}

function getAllRoutes(obj: any, prefix = ''): string[] {
  let routes: string[] = [];
  
  for (const key in obj) {
    const value = obj[key];
    
    if (typeof value === 'string') {
      routes.push(value);
    } else if (typeof value === 'function') {
      // Dynamic route function - extract pattern
      const exampleRoute = value('example-id');
      const pattern = exampleRoute.replace('example-id', '[id]');
      routes.push(pattern);
    } else if (typeof value === 'object') {
      routes = routes.concat(getAllRoutes(value, prefix));
    }
  }
  
  return routes;
}