import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { RelocatoLogoIcon, RelocatoIconSimple } from './CustomIcons';

interface LogoProps {
  variant?: 'full' | 'icon' | 'text' | 'horizontal';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit' | 'white';
  clickable?: boolean;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'medium',
  color = 'primary',
  clickable = false,
  onClick,
}) => {
  const theme = useTheme();

  const getLogoColor = () => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'white':
        return '#ffffff';
      case 'inherit':
      default:
        return 'inherit';
    }
  };

  const getSizes = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 24,
          fontSize: '1rem',
          spacing: 1,
        };
      case 'large':
        return {
          iconSize: 56,
          fontSize: '2rem',
          spacing: 2,
        };
      case 'medium':
      default:
        return {
          iconSize: 40,
          fontSize: '1.5rem',
          spacing: 1.5,
        };
    }
  };

  const sizes = getSizes();
  const logoColor = getLogoColor();

  const logoStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: sizes.spacing,
    cursor: clickable ? 'pointer' : 'default',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none' as const,
    '&:hover': clickable ? {
      transform: 'scale(1.05)',
      filter: 'brightness(1.1)',
    } : {},
  };

  const companyName = 'relocato';

  const renderLogo = () => {
    switch (variant) {
      case 'icon':
        return (
          <RelocatoIconSimple
            sx={{ 
              fontSize: sizes.iconSize, 
              color: logoColor,
            }}
          />
        );

      case 'text':
        return (
          <Typography
            variant="h6"
            sx={{
              fontSize: sizes.fontSize,
              fontWeight: 'bold',
              color: logoColor,
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              letterSpacing: '0.02em',
            }}
          >
            {companyName}
          </Typography>
        );

      case 'horizontal':
        return (
          <>
            <RelocatoIconSimple
              sx={{ 
                fontSize: sizes.iconSize, 
                color: logoColor,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontSize: sizes.fontSize,
                fontWeight: 'bold',
                color: logoColor,
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              {companyName}
            </Typography>
          </>
        );

      case 'full':
      default:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <RelocatoLogoIcon
              sx={{ 
                fontSize: sizes.iconSize, 
                color: logoColor,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontSize: sizes.fontSize,
                fontWeight: 'bold',
                color: logoColor,
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                letterSpacing: '0.02em',
                textAlign: 'center',
              }}
            >
              {companyName}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={logoStyles} onClick={clickable ? onClick : undefined}>
      {renderLogo()}
    </Box>
  );
};

// Animated Logo for Loading States
export const AnimatedLogo: React.FC<LogoProps & { animate?: boolean }> = ({
  animate = true,
  ...props
}) => {
  const theme = useTheme();

  const animationStyles = animate ? {
    '@keyframes logoFloat': {
      '0%, 100%': {
        transform: 'translateY(0px)',
      },
      '50%': {
        transform: 'translateY(-10px)',
      },
    },
    '@keyframes logoPulse': {
      '0%, 100%': {
        opacity: 1,
      },
      '50%': {
        opacity: 0.7,
      },
    },
    animation: 'logoFloat 3s ease-in-out infinite, logoPulse 2s ease-in-out infinite',
  } : {};

  return (
    <Box sx={animationStyles}>
      <Logo {...props} />
    </Box>
  );
};

// Brand Header with Logo and Tagline
export const BrandHeader: React.FC<{
  showTagline?: boolean;
  tagline?: string;
  centered?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit' | 'white';
}> = ({
  showTagline = true,
  tagline = 'Ihr professioneller Umzugspartner',
  centered = false,
  size = 'medium',
  color = 'primary',
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: centered ? 'center' : 'flex-start',
        gap: 1,
      }}
    >
      <Logo variant="horizontal" size={size} color={color} />
      {showTagline && (
        <Typography
          variant="body2"
          sx={{
            color: color === 'white' ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
            fontStyle: 'italic',
            textAlign: centered ? 'center' : 'left',
            maxWidth: 300,
          }}
        >
          {tagline}
        </Typography>
      )}
    </Box>
  );
};

// Logo with Background Pattern
export const LogoWithBackground: React.FC<LogoProps & {
  pattern?: 'gradient' | 'dots' | 'waves' | 'none';
  containerWidth?: number;
  containerHeight?: number;
}> = ({
  pattern = 'gradient',
  containerWidth = 200,
  containerHeight = 120,
  ...props
}) => {
  const theme = useTheme();

  const getBackgroundPattern = () => {
    switch (pattern) {
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        };
      
      case 'dots':
        return {
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backgroundImage: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        };
      
      case 'waves':
        return {
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${encodeURIComponent(alpha(theme.palette.primary.main, 0.1))}' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zM10 30c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        };
      
      case 'none':
      default:
        return {};
    }
  };

  return (
    <Box
      sx={{
        width: containerWidth,
        height: containerHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        ...getBackgroundPattern(),
      }}
    >
      <Logo {...props} />
    </Box>
  );
};

// Responsive Logo that adapts to screen size
export const ResponsiveLogo: React.FC<Omit<LogoProps, 'size'> & {
  breakpoints?: {
    xs?: 'small' | 'medium' | 'large';
    sm?: 'small' | 'medium' | 'large';
    md?: 'small' | 'medium' | 'large';
    lg?: 'small' | 'medium' | 'large';
  };
}> = ({
  breakpoints = {
    xs: 'small',
    sm: 'small', 
    md: 'medium',
    lg: 'large',
  },
  ...props
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        '& .logo-xs': {
          display: 'block',
          [theme.breakpoints.up('sm')]: {
            display: 'none',
          },
        },
        '& .logo-sm': {
          display: 'none',
          [theme.breakpoints.between('sm', 'md')]: {
            display: 'block',
          },
        },
        '& .logo-md': {
          display: 'none',
          [theme.breakpoints.between('md', 'lg')]: {
            display: 'block',
          },
        },
        '& .logo-lg': {
          display: 'none',
          [theme.breakpoints.up('lg')]: {
            display: 'block',
          },
        },
      }}
    >
      {breakpoints.xs && (
        <Box className="logo-xs">
          <Logo {...props} size={breakpoints.xs} />
        </Box>
      )}
      {breakpoints.sm && (
        <Box className="logo-sm">
          <Logo {...props} size={breakpoints.sm} />
        </Box>
      )}
      {breakpoints.md && (
        <Box className="logo-md">
          <Logo {...props} size={breakpoints.md} />
        </Box>
      )}
      {breakpoints.lg && (
        <Box className="logo-lg">
          <Logo {...props} size={breakpoints.lg} />
        </Box>
      )}
    </Box>
  );
};

export default Logo;