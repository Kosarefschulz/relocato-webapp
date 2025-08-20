import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['de', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'de';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  try {
    return {
      messages: (await import(`../../locales/${locale}/common.json`)).default,
    };
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // Fallback to default locale
    return {
      messages: (await import(`../../locales/de/common.json`)).default,
    };
  }
});

// Helper function to get all messages for a locale
export async function getMessages(locale: Locale) {
  try {
    const common = (await import(`../../locales/${locale}/common.json`)).default;
    
    return {
      common,
    };
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // Fallback to default locale
    try {
      const common = (await import(`../../locales/de/common.json`)).default;
      return { common };
    } catch (fallbackError) {
      console.error('Failed to load fallback messages:', fallbackError);
      return {};
    }
  }
}