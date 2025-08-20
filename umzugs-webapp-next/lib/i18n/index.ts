import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'de';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`@/locales/${locale}/common.json`)).default,
  };
});

// Helper function to get all messages for a locale
export async function getMessages(locale: Locale) {
  try {
    const common = (await import(`@/locales/${locale}/common.json`)).default;
    const dashboard = (await import(`@/locales/${locale}/dashboard.json`)).default;
    const customers = (await import(`@/locales/${locale}/customers.json`)).default;
    const quotes = (await import(`@/locales/${locale}/quotes.json`)).default;
    const auth = (await import(`@/locales/${locale}/auth.json`)).default;
    
    return {
      common,
      dashboard,
      customers,
      quotes,
      auth,
    };
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    return {};
  }
}