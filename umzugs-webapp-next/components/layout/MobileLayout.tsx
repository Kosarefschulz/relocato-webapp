'use client';

import React, { useState } from 'react';
import {
  Box,
  SwipeableDrawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Fade,
  Backdrop
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import NavigationMenu from './NavigationMenu';
import BottomNavigation from './BottomNavigation';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBottomNav?: boolean;
  rightActions?: React.ReactNode;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title = 'RELOCATO®',
  showBottomNav = true,
  rightActions,
  showBackButton = false,
  onBackClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event &&
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      window.history.back();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top App Bar */}
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{ 
          backgroundColor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {showBackButton ? (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="back"
                onClick={handleBackClick}
                sx={{ mr: 1 }}
              >
                <ArrowBackIcon />
              </IconButton>
            ) : (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer(true)}
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap component="div">
              {title}
            </Typography>
          </Box>
          
          {rightActions && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {rightActions}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <SwipeableDrawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        disableBackdropTransition={!iOS}
        disableDiscovery={iOS}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: 'background.default',
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            RELOCATO®
          </Typography>
          <IconButton onClick={toggleDrawer(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <NavigationMenu onNavigate={() => setDrawerOpen(false)} />
      </SwipeableDrawer>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          pb: showBottomNav && isMobile ? 7 : 0,
        }}
      >
        <Fade in timeout={300}>
          <Box sx={{ flex: 1 }}>
            {children}
          </Box>
        </Fade>
      </Box>

      {/* Bottom Navigation for Mobile */}
      {showBottomNav && isMobile && (
        <BottomNavigation />
      )}

      {/* Backdrop for drawer */}
      <Backdrop
        sx={{ color: '#fff', zIndex: theme.zIndex.drawer - 1 }}
        open={drawerOpen}
        onClick={toggleDrawer(false)}
      />
    </Box>
  );
};

// iOS detection
const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export default MobileLayout;