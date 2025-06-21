import { useTheme, useMediaQuery } from '@mui/material';
import type { TypographyProps } from '@mui/material/Typography';

type IconSize = 'small' | 'medium' | 'large';
type ButtonSize = 'small' | 'medium' | 'large';
type TypographyVariant = TypographyProps['variant'];

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
    titleVariant: (isMobile ? 'h5' : 'h4') as TypographyVariant,
    subtitleVariant: (isMobile ? 'body1' : 'h6') as TypographyVariant,
    // Sizes
    iconSize: (isMobile ? 'medium' : 'large') as IconSize,
    buttonSize: (isMobile ? 'medium' : 'large') as ButtonSize,
    fabSize: (isMobile ? 'medium' : 'large') as ButtonSize
  };
};