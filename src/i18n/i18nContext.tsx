import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, TranslationKeys } from './translations';

export type Language = 'de' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationKeys) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  formatDateTime: (date: Date) => string;
  formatRelativeTime: (date: Date) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ 
  children, 
  defaultLanguage = 'de' 
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check for saved language preference
    const savedLanguage = localStorage.getItem('relocato-language') as Language;
    if (savedLanguage && (savedLanguage === 'de' || savedLanguage === 'en')) {
      return savedLanguage;
    }
    
    // Check browser language
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith('de')) {
      return 'de';
    } else if (browserLanguage.startsWith('en')) {
      return 'en';
    }
    
    return defaultLanguage;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('relocato-language', lang);
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update HTML dir attribute for RTL languages (future expansion)
    document.documentElement.dir = 'ltr'; // German and English are LTR
  };

  const t = (key: keyof TranslationKeys): string => {
    const translation = translations[language][key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key} (language: ${language})`);
      return key;
    }
    return translation;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const rtf = new Intl.RelativeTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
      numeric: 'auto',
    });

    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  };

  useEffect(() => {
    // Set initial HTML attributes
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    isRTL: false, // German and English are LTR
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// Utility hook for translation with interpolation
export const useTranslation = () => {
  const { t, language } = useI18n();
  
  const tWithParams = (key: keyof TranslationKeys, params?: Record<string, string | number>): string => {
    let translation = t(key);
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(value));
      });
    }
    
    return translation;
  };
  
  return {
    t,
    tWithParams,
    language,
  };
};

// Language selector component
export const LanguageSelector: React.FC<{
  variant?: 'select' | 'toggle' | 'menu';
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
}> = ({ 
  variant = 'select', 
  showLabels = true,
  size = 'medium',
}) => {
  const { language, setLanguage, t } = useI18n();

  if (variant === 'toggle') {
    return (
      <div className={`language-toggle ${size}`}>
        <button
          onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
          className={`toggle-button ${language}`}
          aria-label={`Switch to ${language === 'de' ? 'English' : 'German'}`}
        >
          <span className="flag">
            {language === 'de' ? '🇩🇪' : '🇺🇸'}
          </span>
          {showLabels && (
            <span className="label">
              {language === 'de' ? 'DE' : 'EN'}
            </span>
          )}
        </button>
      </div>
    );
  }

  if (variant === 'select') {
    return (
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className={`language-select ${size}`}
        aria-label="Select Language"
      >
        <option value="de">🇩🇪 {showLabels ? 'Deutsch' : 'DE'}</option>
        <option value="en">🇺🇸 {showLabels ? 'English' : 'EN'}</option>
      </select>
    );
  }

  return (
    <div className={`language-menu ${size}`}>
      <button
        onClick={() => setLanguage('de')}
        className={`menu-item ${language === 'de' ? 'active' : ''}`}
      >
        🇩🇪 {showLabels ? 'Deutsch' : 'DE'}
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`menu-item ${language === 'en' ? 'active' : ''}`}
      >
        🇺🇸 {showLabels ? 'English' : 'EN'}
      </button>
    </div>
  );
};

export default I18nProvider;