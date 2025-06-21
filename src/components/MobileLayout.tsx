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

  if (!isMobile) {
    // Desktop Layout - Original mit Side Navigation
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <NavigationMenu />
        <Box sx={{ flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    );
  }

  // Mobile Layout
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      {/* Mobile AppBar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          backgroundColor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`,
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {showBackButton && onBackClick ? (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="back"
              onClick={onBackClick}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          ) : (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            {title}
          </Typography>

          {rightActions}
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <SwipeableDrawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        disableSwipeToOpen={false}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '85%', sm: 320 },
            maxWidth: '100%',
            bgcolor: 'background.paper'
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Menu
          </Typography>
          <IconButton onClick={toggleDrawer(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Box 
          sx={{ width: '100%' }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <NavigationMenu mobile />
        </Box>
      </SwipeableDrawer>

      {/* Backdrop for better UX */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: theme.zIndex.drawer - 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        open={drawerOpen}
        onClick={toggleDrawer(false)}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 7, sm: 8 }, // AppBar height
          pb: showBottomNav ? { xs: 7, sm: 8 } : 0, // Bottom nav height
          width: '100%',
          minHeight: '100vh',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          })
        }}
      >
        <Fade in timeout={300}>
          <Box>{children}</Box>
        </Fade>
      </Box>

      {/* Bottom Navigation */}
      {showBottomNav && isMobile && <BottomNavigation />}
    </Box>
  );
};

export default MobileLayout;