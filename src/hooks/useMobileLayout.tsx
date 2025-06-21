import { useTheme, useMediaQuery } from '@mui/material';

export const useMobileLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return {
    isMobile,
    isTablet,
    isSmallMobile,
    isDesktop: !isTablet,
    // Helper values
    spacing: isMobile ? 2 : 3,
    cardPadding: isMobile ? 2 : 3,
    containerPadding: isMobile ? 2 : 3,
    gridSpacing: isMobile ? 2 : 3,
    // Typography variants
    titleVariant: isMobile ? 'h5' : 'h4',
    subtitleVariant: isMobile ? 'body1' : 'h6',
    // Sizes
    iconSize: isMobile ? 'medium' : 'large',
    buttonSize: isMobile ? 'medium' : 'large',
    fabSize: isMobile ? 'medium' : 'large'
  };
};