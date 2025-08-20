import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/index.ts');

const nextConfig: NextConfig = {
  experimental: {
    // Turbopack ist bereits standardmäßig aktiviert durch --turbopack Flag
    typedRoutes: true, // Typsichere Routen aktivieren
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lucide-react',
      'recharts',
      'date-fns',
    ],
  },
  
  // React 19 Features
  reactStrictMode: true,
  
  // Bildoptimierung
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
    ],
  },
  
  // Environment Variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // Headers für Sicherheit
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Rewrites für API Proxy (falls benötigt)
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://api.example.com/:path*',
      },
    ];
  },
  
  // Redirects für alte Routen
  async redirects() {
    return [
      {
        source: '/old-dashboard',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
