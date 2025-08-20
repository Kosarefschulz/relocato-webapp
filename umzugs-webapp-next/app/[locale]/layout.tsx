import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/lib/i18n';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/Toaster';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import type { Metadata } from 'next';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Relocato CRM',
    default: 'Relocato CRM - Umzugsverwaltung',
  },
  description: 'Professionelle Umzugsverwaltung und CRM System',
  keywords: ['CRM', 'Umzug', 'Verwaltung', 'Relocato'],
  authors: [{ name: 'Relocato Team' }],
  creator: 'Relocato',
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://relocato.de',
    siteName: 'Relocato CRM',
    title: 'Relocato CRM - Umzugsverwaltung',
    description: 'Professionelle Umzugsverwaltung und CRM System',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Relocato CRM',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Relocato CRM',
    description: 'Professionelle Umzugsverwaltung und CRM System',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default async function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  // Validate locale
  const isValidLocale = ['de', 'en'].includes(locale);
  if (!isValidLocale) notFound();

  // Load translations
  const messages = await getMessages(locale as 'de' | 'en');

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SupabaseProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </SupabaseProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}