import { useTheme, useMediaQuery } from '@mui/material';
import { Variant } from '@mui/material/styles/createTypography';

type IconSize = 'small' | 'medium' | 'large';
type ButtonSize = 'small' | 'medium' | 'large';

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
    titleVariant: (isMobile ? 'h5' : 'h4') as Variant,
    subtitleVariant: (isMobile ? 'body1' : 'h6') as Variant,
    // Sizes
    iconSize: (isMobile ? 'medium' : 'large') as IconSize,
    buttonSize: (isMobile ? 'medium' : 'large') as ButtonSize,
    fabSize: (isMobile ? 'medium' : 'large') as ButtonSize
  };
};