import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTheme } from '@mui/material/styles';
import { GlobalStyles } from '@mui/material';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorBlindnessSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings: () => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  skipToContent: () => void;
  isReducedMotion: boolean;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReaderOptimized: false,
  keyboardNavigation: true,
  focusIndicators: true,
  fontSize: 'medium',
  colorBlindnessSupport: 'none',
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const theme = useTheme();
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('relocato-accessibility');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    
    // Check system preferences
    const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    return {
      ...defaultSettings,
      reducedMotion: hasReducedMotion,
      highContrast: hasHighContrast,
    };
  });

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('relocato-accessibility', JSON.stringify(newSettings));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('relocato-accessibility');
  };

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const skipToContent = () => {
    const mainContent = document.getElementById('main-content') || document.querySelector('main');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Apply accessibility settings to DOM
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Screen reader optimization
    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }
    
    // Font size
    root.setAttribute('data-font-size', settings.fontSize);
    
    // Color blindness support
    root.setAttribute('data-colorblind-filter', settings.colorBlindnessSupport);
    
    // Focus indicators
    if (!settings.focusIndicators) {
      root.classList.add('no-focus-indicators');
    } else {
      root.classList.remove('no-focus-indicators');
    }
  }, [settings]);

  // Listen for system preference changes
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('relocato-accessibility')) {
        updateSetting('reducedMotion', e.matches);
      }
    };
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('relocato-accessibility')) {
        updateSetting('highContrast', e.matches);
      }
    };
    
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);
    
    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!settings.keyboardNavigation) return;
      
      // Skip to content shortcut
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        skipToContent();
        announceToScreenReader('Springe zum Hauptinhalt');
      }
      
      // Accessibility menu shortcut
      if (event.altKey && event.key === 'a') {
        event.preventDefault();
        const accessibilityButton = document.querySelector('[data-accessibility-menu]') as HTMLElement;
        if (accessibilityButton) {
          accessibilityButton.click();
          announceToScreenReader('Barrierefreiheits-Menü geöffnet');
        }
      }
      
      // High contrast toggle
      if (event.altKey && event.key === 'h') {
        event.preventDefault();
        updateSetting('highContrast', !settings.highContrast);
        announceToScreenReader(
          settings.highContrast ? 'Hoher Kontrast deaktiviert' : 'Hoher Kontrast aktiviert'
        );
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings, skipToContent, announceToScreenReader]);

  const value: AccessibilityContextType = {
    settings,
    updateSetting,
    resetSettings,
    announceToScreenReader,
    skipToContent,
    isReducedMotion: settings.reducedMotion,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Screen reader announcements area */}
      <div 
        id="accessibility-announcements" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      />
      
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="skip-to-content"
        onClick={(e) => {
          e.preventDefault();
          skipToContent();
        }}
      >
        Zum Hauptinhalt springen
      </a>
      
      <GlobalStyles styles={{
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        },
        '.skip-to-content': {
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: theme.palette.primary.main,
          color: 'white',
          padding: '8px 16px',
          textDecoration: 'none',
          borderRadius: '4px',
          zIndex: 10000,
          transition: 'top 0.3s',
        },
        '.skip-to-content:focus': {
          top: '6px',
        },
        /* High contrast mode */
        '.high-contrast': {
          filter: 'contrast(150%)',
        },
        '.high-contrast *': {
          textShadow: 'none !important',
          boxShadow: 'none !important',
        },
        '.high-contrast button, .high-contrast .MuiButton-root': {
          border: '2px solid currentColor !important',
        },
        /* Large text mode */
        '.large-text': {
          fontSize: '120% !important',
        },
        '.large-text *': {
          lineHeight: '1.6 !important',
        },
        /* Reduced motion */
        '.reduced-motion *, .reduced-motion *::before, .reduced-motion *::after': {
          animationDuration: '0.01ms !important',
          animationIterationCount: '1 !important',
          transitionDuration: '0.01ms !important',
          scrollBehavior: 'auto !important',
        },
        /* Font size variations */
        '[data-font-size="small"]': {
          fontSize: '90%',
        },
        '[data-font-size="large"]': {
          fontSize: '120%',
        },
        '[data-font-size="extra-large"]': {
          fontSize: '140%',
        },
        /* Color blindness filters */
        '[data-colorblind-filter="protanopia"]': {
          filter: 'url(#protanopia-filter)',
        },
        '[data-colorblind-filter="deuteranopia"]': {
          filter: 'url(#deuteranopia-filter)',
        },
        '[data-colorblind-filter="tritanopia"]': {
          filter: 'url(#tritanopia-filter)',
        },
        /* Focus indicators */
        '.no-focus-indicators *:focus': {
          outline: 'none !important',
          boxShadow: 'none !important',
        },
        /* Enhanced focus indicators */
        '*:focus-visible': {
          outline: `3px solid ${theme.palette.primary.main} !important`,
          outlineOffset: '2px !important',
        },
        /* Screen reader optimizations */
        '.screen-reader-optimized .MuiIconButton-root': {
          minWidth: '44px',
          minHeight: '44px',
        },
        '.screen-reader-optimized button:not([aria-label]):not([aria-labelledby])': {
          position: 'relative',
        },
        '.screen-reader-optimized button:not([aria-label]):not([aria-labelledby])::after': {
          content: 'attr(title)',
          position: 'absolute',
          left: '-9999px',
        },
      }} />
      
      {/* SVG filters for color blindness simulation */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"/>
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"/>
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"/>
          </filter>
        </defs>
      </svg>
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;