import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

interface LogoProps {
  variant?: 'default' | 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  imageOnly?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'default', 
  size = 'medium', 
  showText = true,
  imageOnly = false 
}) => {
  const theme = useTheme();
  
  const sizes = {
    small: { height: 32, fontSize: '1.2rem' },
    medium: { height: 48, fontSize: '1.5rem' },
    large: { height: 64, fontSize: '2rem' },
  };

  const currentSize = sizes[size];

  if (imageOnly) {
    return (
      <Box
        component="img"
        src="/wertvoll-logo.png"
        alt="Wertvoll Logo"
        sx={{
          height: currentSize.height,
          width: 'auto',
          objectFit: 'contain',
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          '&:hover': {
            '& img': {
              transform: 'translateY(-2px)',
            },
          },
        }}
      >
        <Box
          component="img"
          src="/wertvoll-logo.png"
          alt="Wertvoll Logo"
          sx={{
            height: currentSize.height,
            width: 'auto',
            transition: 'transform 0.3s ease',
            objectFit: 'contain',
          }}
        />
        {showText && (
          <Typography
            variant="h6"
            sx={{
              fontSize: currentSize.fontSize,
              fontWeight: 700,
              color: '#4ABDBD', // Wertvoll Türkis-Grün
              letterSpacing: '-0.02em',
            }}
          >
            Relocato
          </Typography>
        )}
      </Box>
    </motion.div>
  );
};

export default Logo;