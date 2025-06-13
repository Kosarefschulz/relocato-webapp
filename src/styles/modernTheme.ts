import { createTheme, alpha } from '@mui/material/styles';

// Moderne Farbpalette
const colors = {
  primary: {
    main: '#0F172A', // Slate-900
    light: '#1E293B', // Slate-800
    dark: '#020617', // Slate-950
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#3B82F6', // Blue-500
    light: '#60A5FA', // Blue-400
    dark: '#2563EB', // Blue-600
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#10B981', // Emerald-500
    light: '#34D399', // Emerald-400
    dark: '#059669', // Emerald-600
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#F59E0B', // Amber-500
    light: '#FBBF24', // Amber-400
    dark: '#D97706', // Amber-600
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#EF4444', // Red-500
    light: '#F87171', // Red-400
    dark: '#DC2626', // Red-600
    contrastText: '#FFFFFF',
  },
  grey: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  background: {
    default: '#F8FAFC',
    paper: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    disabled: '#94A3B8',
  },
};

// Dark mode colors
const darkColors = {
  primary: {
    main: '#60A5FA', // Blue-400
    light: '#93BBFC',
    dark: '#3B82F6',
    contrastText: '#0F172A',
  },
  secondary: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#0F172A',
    paper: '#1E293B',
    elevated: '#334155',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#CBD5E1',
    disabled: '#64748B',
  },
};

export const modernTheme = createTheme({
  palette: {
    mode: 'light',
    ...colors,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
    '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
    '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
    '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
    '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
    '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
    '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
    '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
    '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
    '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
    '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
    '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
    '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
    '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
    '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
  ],
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(15, 23, 42, 0.05)',
    '0px 4px 8px rgba(15, 23, 42, 0.08)',
    '0px 8px 16px rgba(15, 23, 42, 0.12)',
    '0px 12px 24px rgba(15, 23, 42, 0.16)',
    '0px 16px 32px rgba(15, 23, 42, 0.20)',
    '0px 20px 40px rgba(15, 23, 42, 0.24)',
    ...Array(19).fill('0px 24px 48px rgba(15, 23, 42, 0.32)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: colors.grey[100],
          },
          '&::-webkit-scrollbar-thumb': {
            background: colors.grey[400],
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: colors.grey[500],
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 500,
          padding: '10px 20px',
          minHeight: 44,
          minWidth: 44,
          transition: 'all 0.2s ease-in-out',
          '@media (max-width: 600px)': {
            minHeight: 48,
            padding: '12px 20px',
          },
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          boxShadow: '0px 4px 12px rgba(59, 130, 246, 0.15)',
          '&:hover': {
            boxShadow: '0px 8px 20px rgba(59, 130, 246, 0.25)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: alpha(colors.primary.main, 0.04),
          },
        },
        sizeLarge: {
          padding: '12px 28px',
          fontSize: '1rem',
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.background.paper,
          border: `1px solid ${colors.grey[200]}`,
          boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.04)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.08)',
          },
        },
        elevation1: {
          boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.04)',
        },
        elevation2: {
          boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.08)',
        },
        elevation3: {
          boxShadow: '0px 12px 32px rgba(15, 23, 42, 0.12)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${colors.grey[200]}`,
          boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.04)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 12px 32px rgba(15, 23, 42, 0.12)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s ease-in-out',
            backgroundColor: colors.background.paper,
            '& input': {
              fontSize: '16px', // Prevents iOS zoom
              '@media (max-width: 600px)': {
                padding: '16px 14px',
              },
            },
            '& fieldset': {
              borderColor: colors.grey[300],
              transition: 'all 0.2s ease-in-out',
            },
            '&:hover fieldset': {
              borderColor: colors.grey[400],
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.secondary.main,
              borderWidth: '2px',
            },
            '&.Mui-focused': {
              boxShadow: `0px 0px 0px 4px ${alpha(colors.secondary.main, 0.1)}`,
            },
          },
          '& .MuiInputLabel-root': {
            color: colors.text.secondary,
            '&.Mui-focused': {
              color: colors.secondary.main,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          border: 'none',
        },
        filled: {
          backgroundColor: alpha(colors.secondary.main, 0.1),
          color: colors.secondary.dark,
          '&:hover': {
            backgroundColor: alpha(colors.secondary.main, 0.2),
          },
        },
        outlined: {
          borderColor: colors.grey[300],
          '&:hover': {
            backgroundColor: alpha(colors.grey[500], 0.08),
          },
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: alpha(colors.background.paper, 0.8),
          color: colors.text.primary,
          borderBottom: `1px solid ${colors.grey[200]}`,
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: 8,
          minHeight: 44,
          minWidth: 44,
          transition: 'all 0.2s ease-in-out',
          '@media (max-width: 600px)': {
            minHeight: 48,
            minWidth: 48,
            padding: 12,
          },
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.04),
            transform: 'scale(1.1)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '4px 8px',
          minHeight: 48,
          transition: 'all 0.2s ease-in-out',
          '@media (max-width: 600px)': {
            minHeight: 52,
            padding: '12px 16px',
          },
          '&:hover': {
            backgroundColor: alpha(colors.secondary.main, 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.secondary.main, 0.12),
            '&:hover': {
              backgroundColor: alpha(colors.secondary.main, 0.16),
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9rem',
          marginRight: 24,
          minHeight: 48,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            color: colors.secondary.main,
          },
          '&.Mui-selected': {
            color: colors.secondary.main,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
          backgroundColor: colors.secondary.main,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: 'none',
        },
        standardSuccess: {
          backgroundColor: alpha(colors.success.main, 0.1),
          color: colors.success.dark,
        },
        standardError: {
          backgroundColor: alpha(colors.error.main, 0.1),
          color: colors.error.dark,
        },
        standardWarning: {
          backgroundColor: alpha(colors.warning.main, 0.1),
          color: colors.warning.dark,
        },
        standardInfo: {
          backgroundColor: alpha(colors.secondary.main, 0.1),
          color: colors.secondary.dark,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0px 24px 64px rgba(15, 23, 42, 0.24)',
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            borderRadius: 10,
            backgroundColor: colors.grey[900],
            color: colors.grey[50],
          },
        },
      },
    },
  },
});

// Dark theme variant
export const darkTheme = createTheme({
  ...modernTheme,
  palette: {
    mode: 'dark',
    ...darkColors,
    grey: colors.grey,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  },
  shadows: modernTheme.shadows,
});

// Glassmorphism utilities
export const glassmorphism = {
  light: {
    background: alpha('#FFFFFF', 0.7),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha('#FFFFFF', 0.2)}`,
    boxShadow: '0px 8px 32px rgba(15, 23, 42, 0.1)',
  },
  dark: {
    background: alpha('#1E293B', 0.7),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha('#FFFFFF', 0.1)}`,
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.3)',
  },
};

// Animation variants for Framer Motion
export const animations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  },
  slideIn: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: 0.2 },
  },
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
};