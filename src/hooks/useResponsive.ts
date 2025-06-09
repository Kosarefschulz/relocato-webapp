import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

export const useResponsive = () => {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // Spezifische Breakpoints
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));

  // Touch-Device Detection
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Viewport Dimensions
  const getViewportHeight = () => {
    // Berücksichtigt mobile Browser-UI
    return window.innerHeight || document.documentElement.clientHeight;
  };

  const getViewportWidth = () => {
    return window.innerWidth || document.documentElement.clientWidth;
  };

  // Responsive Grid Props
  const getGridProps = (mobile: number, tablet: number, desktop: number) => ({
    xs: mobile,
    sm: tablet,
    md: desktop,
  });

  // Responsive Spacing
  const getSpacing = (mobile: number, desktop: number) => 
    isMobile ? mobile : desktop;

  // Container Props
  const getContainerProps = () => ({
    maxWidth: isMobile ? 'sm' : 'lg' as 'sm' | 'lg',
    sx: {
      px: isMobile ? 1 : 3,
      py: isMobile ? 2 : 4,
    }
  });

  // Button Props für Touch-Optimierung
  const getButtonProps = () => ({
    size: (isMobile ? 'large' : 'medium') as 'large' | 'medium',
    sx: {
      minHeight: isMobile ? 52 : 44,
      fontSize: isMobile ? '1.1rem' : '1rem',
    }
  });

  // TextField Props für Mobile
  const getTextFieldProps = () => ({
    sx: {
      '& .MuiInputBase-input': {
        fontSize: isMobile ? '16px' : '14px', // Verhindert Zoom auf iOS
      }
    },
    inputProps: {
      ...(isMobile && { style: { fontSize: '16px' } })
    }
  });

  return {
    // Screen Size Checks
    isMobile,
    isTablet, 
    isDesktop,
    isSmallScreen,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    
    // Device Info
    isTouchDevice,
    
    // Utility Functions
    getViewportHeight,
    getViewportWidth,
    getGridProps,
    getSpacing,
    getContainerProps,
    getButtonProps,
    getTextFieldProps,
    
    // Common Responsive Values
    containerSpacing: isMobile ? 2 : 4,
    cardSpacing: isMobile ? 1 : 2,
    buttonHeight: isMobile ? 52 : 44,
    iconSize: isMobile ? 24 : 20,
    titleVariant: (isMobile ? 'h5' : 'h4') as 'h4' | 'h5',
    subtitleVariant: (isMobile ? 'h6' : 'h5') as 'h5' | 'h6',
  };
};