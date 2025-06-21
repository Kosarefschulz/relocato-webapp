import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import NavigationMenu from './NavigationMenu';
import { Outlet } from 'react-router-dom';

const AppLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    // Mobile layout is handled by MobileLayout component in each page
    return <Outlet />;
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        // Gradient background for glassmorphism effect
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2), transparent 50%)
          `,
          zIndex: 0
        }
      }}
    >
      {/* Navigation Menu */}
      <Box sx={{ 
        zIndex: 10,
        position: 'relative',
        height: '100vh',
        flexShrink: 0
      }}>
        <NavigationMenu />
      </Box>
      
      {/* Main Content */}
      <Box 
        component="main"
        sx={{ 
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppLayout;