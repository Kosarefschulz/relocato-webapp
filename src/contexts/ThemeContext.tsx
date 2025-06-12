import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  themeColor: 'blue' | 'purple' | 'green' | 'red';
  setThemeColor: (color: 'blue' | 'purple' | 'green' | 'red') => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  borderRadius: 'small' | 'medium' | 'large';
  setBorderRadius: (radius: 'small' | 'medium' | 'large') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Check localStorage and system preference
  const getInitialTheme = (): boolean => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    // Check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [darkMode, setDarkMode] = useState(getInitialTheme);
  const [themeColor, setThemeColor] = useState<'blue' | 'purple' | 'green' | 'red'>(() => {
    return (localStorage.getItem('themeColor') as any) || 'blue';
  });
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('fontSize') as any) || 'medium';
  });
  const [borderRadius, setBorderRadius] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('borderRadius') as any) || 'medium';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('themeColor', themeColor);
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('borderRadius', borderRadius);
  }, [borderRadius]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Corporate Color Schemes - Professional Moving Company Branding
  const getColorScheme = (color: string) => {
    const schemes = {
      blue: {
        // Professional Blue - Trust, Reliability, Corporate
        main: darkMode ? '#4FC3F7' : '#1565C0',
        light: darkMode ? '#81D4FA' : '#42A5F5',
        dark: darkMode ? '#0288D1' : '#0D47A1',
        contrastText: '#FFFFFF',
      },
      purple: {
        // Premium Purple - Luxury Moving Services
        main: darkMode ? '#BA68C8' : '#7B1FA2',
        light: darkMode ? '#CE93D8' : '#AB47BC',
        dark: darkMode ? '#8E24AA' : '#4A148C',
        contrastText: '#FFFFFF',
      },
      green: {
        // Success Green - Completed Jobs, Eco-Friendly
        main: darkMode ? '#66BB6A' : '#2E7D32',
        light: darkMode ? '#81C784' : '#4CAF50',
        dark: darkMode ? '#388E3C' : '#1B5E20',
        contrastText: '#FFFFFF',
      },
      red: {
        // Alert Red - Urgent, Important Actions
        main: darkMode ? '#EF5350' : '#D32F2F',
        light: darkMode ? '#F44336' : '#F44336',
        dark: darkMode ? '#C62828' : '#B71C1C',
        contrastText: '#FFFFFF',
      },
    };
    return schemes[color as keyof typeof schemes];
  };

  // Font size scales
  const getFontScale = (size: string) => {
    const scales = {
      small: { h1: 1.8, h2: 1.6, h3: 1.4, h4: 1.2, h5: 1.1, h6: 1.0, body1: 0.9, body2: 0.8 },
      medium: { h1: 2.125, h2: 1.875, h3: 1.5, h4: 1.25, h5: 1.125, h6: 1.0, body1: 1.0, body2: 0.875 },
      large: { h1: 2.5, h2: 2.0, h3: 1.75, h4: 1.5, h5: 1.25, h6: 1.125, body1: 1.125, body2: 1.0 },
    };
    return scales[size as keyof typeof scales];
  };

  // Border radius values
  const getBorderRadius = (radius: string) => {
    const radii = {
      small: 4,
      medium: 8,
      large: 16,
    };
    return radii[radius as keyof typeof radii];
  };

  const currentColorScheme = getColorScheme(themeColor);
  const currentFontScale = getFontScale(fontSize);
  const currentBorderRadius = getBorderRadius(borderRadius);

  // Create premium theme with dark mode support
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: currentColorScheme,
      secondary: {
        // Professional Orange - Action, Energy, Moving
        main: darkMode ? '#FFB74D' : '#F57C00',
        light: darkMode ? '#FFCC02' : '#FFB300',
        dark: darkMode ? '#FF8F00' : '#E65100',
        contrastText: darkMode ? '#1A1A1A' : '#FFFFFF',
      },
      background: {
        default: darkMode ? '#0A0E1A' : '#FAFBFC',
        paper: darkMode ? '#1A2332' : '#FFFFFF',
      },
      text: {
        primary: darkMode ? '#F8FAFC' : '#1A202C',
        secondary: darkMode ? '#A0AEC0' : '#4A5568',
      },
      divider: darkMode ? alpha('#4A5568', 0.3) : alpha('#E2E8F0', 0.8),
      // Additional corporate colors
      grey: {
        50: '#F7FAFC',
        100: '#EDF2F7',
        200: '#E2E8F0',
        300: '#CBD5E0',
        400: '#A0AEC0',
        500: '#718096',
        600: '#4A5568',
        700: '#2D3748',
        800: '#1A202C',
        900: '#171923',
      },
      success: {
        // Professional Green - Success, Completion, Eco-friendly
        main: darkMode ? '#48BB78' : '#38A169',
        light: darkMode ? '#68D391' : '#48BB78',
        dark: darkMode ? '#38A169' : '#2F855A',
        contrastText: '#FFFFFF',
      },
      warning: {
        // Professional Amber - Caution, Pending, Review
        main: darkMode ? '#F6AD55' : '#DD6B20',
        light: darkMode ? '#F6E05E' : '#F6AD55',
        dark: darkMode ? '#DD6B20' : '#C05621',
        contrastText: darkMode ? '#1A202C' : '#FFFFFF',
      },
      error: {
        // Professional Red - Errors, Cancellations, Urgent
        main: darkMode ? '#FC8181' : '#E53E3E',
        light: darkMode ? '#FEB2B2' : '#FC8181',
        dark: darkMode ? '#E53E3E' : '#C53030',
        contrastText: '#FFFFFF',
      },
      info: {
        // Professional Cyan - Information, Tips, Help
        main: darkMode ? '#63B3ED' : '#3182CE',
        light: darkMode ? '#90CDF4' : '#63B3ED',
        dark: darkMode ? '#3182CE' : '#2C5282',
        contrastText: '#FFFFFF',
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 800,
        letterSpacing: '-0.025em',
        fontSize: `${currentFontScale.h1}rem`,
        '@media (max-width:600px)': {
          fontSize: `${currentFontScale.h1 * 0.8}rem`,
        },
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
        fontSize: `${currentFontScale.h2}rem`,
        '@media (max-width:600px)': {
          fontSize: `${currentFontScale.h2 * 0.8}rem`,
        },
      },
      h3: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
        fontSize: `${currentFontScale.h3}rem`,
        '@media (max-width:600px)': {
          fontSize: `${currentFontScale.h3 * 0.85}rem`,
        },
      },
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
        fontSize: `${currentFontScale.h4}rem`,
        '@media (max-width:600px)': {
          fontSize: `${currentFontScale.h4 * 0.85}rem`,
        },
      },
      h5: {
        fontWeight: 600,
        fontSize: `${currentFontScale.h5}rem`,
        '@media (max-width:600px)': {
          fontSize: `${currentFontScale.h5 * 0.9}rem`,
        },
      },
      h6: {
        fontWeight: 600,
        fontSize: `${currentFontScale.h6}rem`,
        '@media (max-width:600px)': {
          fontSize: `${currentFontScale.h6 * 0.9}rem`,
        },
      },
      body1: {
        fontSize: `${currentFontScale.body1}rem`,
        '@media (max-width:600px)': {
          fontSize: `${currentFontScale.body1 * 0.9}rem`,
        },
      },
      body2: {
        fontSize: `${currentFontScale.body2}rem`,
        '@media (max-width:600px)': {
          fontSize: `${currentFontScale.body2 * 0.9}rem`,
        },
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        '@media (max-width:600px)': {
          fontSize: '0.875rem',
        },
      },
    },
    shape: {
      borderRadius: currentBorderRadius,
    },
    shadows: darkMode ? [
      'none',
      `0 1px 2px 0 ${alpha('#000', 0.3)}`,
      `0 1px 3px 0 ${alpha('#000', 0.3)}, 0 1px 2px -1px ${alpha('#000', 0.3)}`,
      `0 4px 6px -1px ${alpha('#000', 0.3)}, 0 2px 4px -2px ${alpha('#000', 0.3)}`,
      `0 10px 15px -3px ${alpha('#000', 0.3)}, 0 4px 6px -4px ${alpha('#000', 0.3)}`,
      `0 20px 25px -5px ${alpha('#000', 0.3)}, 0 8px 10px -6px ${alpha('#000', 0.3)}`,
      `0 25px 50px -12px ${alpha('#000', 0.4)}`,
      ...Array(18).fill(`0 25px 50px -12px ${alpha('#000', 0.4)}`),
    ] as any : undefined,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: currentBorderRadius,
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 20px',
            transition: 'all 0.2s ease-in-out',
            '@media (max-width:600px)': {
              padding: '8px 16px',
              minHeight: '44px',
            },
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: darkMode 
                ? `0 10px 20px -5px ${alpha('#000', 0.4)}` 
                : `0 10px 20px -5px ${alpha('#000', 0.2)}`,
            },
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          small: {
            '@media (max-width:600px)': {
              padding: '6px 12px',
              minHeight: '36px',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: currentBorderRadius,
            boxShadow: darkMode 
              ? `0 2px 8px 0 ${alpha('#000', 0.4)}, 0 1px 3px -1px ${alpha('#000', 0.3)}`
              : `0 2px 8px 0 ${alpha('#000', 0.04)}, 0 1px 3px -1px ${alpha('#000', 0.02)}`,
            border: `1px solid ${darkMode ? alpha('#4A5568', 0.2) : alpha('#E2E8F0', 0.8)}`,
            backdropFilter: 'blur(12px)',
            backgroundColor: darkMode 
              ? alpha('#1A2332', 0.95) 
              : alpha('#FFFFFF', 0.98),
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: darkMode 
                ? `0 4px 16px 0 ${alpha('#000', 0.5)}, 0 2px 6px -2px ${alpha('#000', 0.4)}`
                : `0 4px 16px 0 ${alpha('#000', 0.08)}, 0 2px 6px -2px ${alpha('#000', 0.04)}`,
            },
            '@media (max-width:600px)': {
              borderRadius: Math.max(currentBorderRadius - 4, 4),
              '&:hover': {
                transform: 'none',
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: darkMode 
              ? alpha('#1A2332', 0.95) 
              : alpha('#FFFFFF', 0.98),
            borderRadius: currentBorderRadius,
            border: `1px solid ${darkMode ? alpha('#4A5568', 0.15) : alpha('#E2E8F0', 0.6)}`,
            backdropFilter: 'blur(8px)',
          },
          elevation1: {
            boxShadow: darkMode 
              ? `0 1px 3px 0 ${alpha('#000', 0.3)}, 0 1px 2px -1px ${alpha('#000', 0.25)}`
              : `0 1px 3px 0 ${alpha('#000', 0.06)}, 0 1px 2px -1px ${alpha('#000', 0.04)}`,
          },
          elevation2: {
            boxShadow: darkMode 
              ? `0 2px 8px 0 ${alpha('#000', 0.35)}, 0 1px 3px -1px ${alpha('#000', 0.3)}`
              : `0 2px 8px 0 ${alpha('#000', 0.08)}, 0 1px 3px -1px ${alpha('#000', 0.05)}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: currentBorderRadius / 2,
            fontSize: '0.75rem',
            height: 28,
            '&.MuiChip-filled': {
              boxShadow: darkMode 
                ? `0 1px 3px 0 ${alpha('#000', 0.2)}`
                : `0 1px 3px 0 ${alpha('#000', 0.1)}`,
            },
          },
          colorPrimary: {
            backgroundColor: currentColorScheme.main,
            color: currentColorScheme.contrastText,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: currentBorderRadius,
              transition: 'all 0.2s ease-in-out',
              '@media (max-width:600px)': {
                borderRadius: Math.max(currentBorderRadius - 2, 4),
              },
              '&:hover': {
                transform: 'translateY(-1px)',
                '@media (max-width:600px)': {
                  transform: 'none',
                },
              },
              '&.Mui-focused': {
                transform: 'translateY(-1px)',
                boxShadow: darkMode 
                  ? `0 0 0 3px ${alpha('#60A5FA', 0.1)}`
                  : `0 0 0 3px ${alpha('#0F172A', 0.05)}`,
                '@media (max-width:600px)': {
                  transform: 'none',
                },
              },
            },
            '& .MuiInputLabel-root': {
              '@media (max-width:600px)': {
                fontSize: '0.875rem',
              },
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            minHeight: 48,
            '&.Mui-selected': {
              fontWeight: 700,
            },
          },
        },
      },
      MuiSpeedDial: {
        styleOverrides: {
          fab: {
            backgroundColor: currentColorScheme.main,
            color: currentColorScheme.contrastText,
            boxShadow: darkMode 
              ? `0 4px 16px 0 ${alpha('#000', 0.4)}`
              : `0 4px 16px 0 ${alpha('#000', 0.1)}`,
            '&:hover': {
              backgroundColor: currentColorScheme.dark,
              transform: 'scale(1.05)',
            },
          },
        },
      },
      // Additional corporate components
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: darkMode ? alpha('#2D3748', 0.8) : alpha('#F7FAFC', 0.8),
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              color: darkMode ? '#A0AEC0' : '#4A5568',
              borderBottom: `2px solid ${currentColorScheme.main}`,
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: darkMode 
                ? alpha(currentColorScheme.main, 0.08)
                : alpha(currentColorScheme.main, 0.04),
            },
            '&.Mui-selected': {
              backgroundColor: darkMode 
                ? alpha(currentColorScheme.main, 0.15)
                : alpha(currentColorScheme.main, 0.08),
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: currentBorderRadius,
            fontWeight: 500,
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      toggleDarkMode, 
      themeColor, 
      setThemeColor, 
      fontSize, 
      setFontSize, 
      borderRadius, 
      setBorderRadius 
    }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};