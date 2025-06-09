import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App.simple';
import { useResponsive } from '../hooks/useResponsive';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  Logout as LogoutIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  AccountCircle as AccountCircleIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const { isMobile, isSmallScreen, getGridProps, getContainerProps, titleVariant } = useResponsive();
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      logout();
      handleClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const dashboardItems = [
    {
      title: 'Kunde suchen',
      description: 'Bestehenden Kunden finden',
      icon: <SearchIcon sx={{ fontSize: isMobile ? 40 : 48 }} />,
      action: () => navigate('/search-customer'),
      color: '#1976d2',
      shortDescription: 'Kunde finden'
    },
    {
      title: 'Neuer Kunde',
      description: 'Neuen Kunden anlegen',
      icon: <AddIcon sx={{ fontSize: isMobile ? 40 : 48 }} />,
      action: () => navigate('/new-customer'),
      color: '#2e7d32',
      shortDescription: 'Kunde anlegen'
    },
    {
      title: 'Angebote',
      description: 'Alle Angebote anzeigen',
      icon: <DescriptionIcon sx={{ fontSize: isMobile ? 40 : 48 }} />,
      action: () => navigate('/quotes'),
      color: '#ed6c02',
      shortDescription: 'Angebote verwalten'
    },
    {
      title: 'Kunden',
      description: 'Kundenliste anzeigen',
      icon: <PeopleIcon sx={{ fontSize: isMobile ? 40 : 48 }} />,
      action: () => navigate('/customers'),
      color: '#9c27b0',
      shortDescription: 'Kunden verwalten'
    }
  ];

  const quickActions = [
    {
      icon: <SearchIcon />,
      label: 'Suchen',
      action: () => navigate('/search-customer'),
      color: '#1976d2'
    },
    {
      icon: <AddIcon />,
      label: 'Neu',
      action: () => navigate('/new-customer'),
      color: '#2e7d32'
    }
  ];

  // Mobile Drawer Menu
  const mobileMenu = (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          pt: 2
        }
      }}
    >
      <Box sx={{ px: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" color="primary">
            Umzugs-Angebote
          </Typography>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Divider />
      
      <List>
        {dashboardItems.map((item, index) => (
          <ListItem 
            key={index} 
            onClick={() => {
              item.action();
              setMobileMenuOpen(false);
            }}
            sx={{ 
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <ListItemIcon sx={{ color: item.color }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.title}
              secondary={item.shortDescription}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mt: 'auto' }} />
      
      <List>
        <ListItem onClick={handleLogout} sx={{ cursor: 'pointer' }}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Abmelden" />
        </ListItem>
      </List>
    </Drawer>
  );

  return (
    <>
      <AppBar position="static" elevation={isMobile ? 1 : 4}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {isMobile ? 'Angebote' : 'Umzugs-Angebote'}
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="large"
                aria-label="account menu"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  U
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Abmelden
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {isMobile && mobileMenu}

      <Container {...getContainerProps()}>
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography variant={titleVariant} gutterBottom>
            Dashboard
          </Typography>
          {!isMobile && (
            <Typography variant="body1" color="text.secondary">
              Willkommen zurück! Was möchten Sie heute erledigen?
            </Typography>
          )}
        </Box>
        
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {dashboardItems.map((item, index) => (
            <Grid {...getGridProps(12, 6, 6)} key={index}>
              <Paper
                sx={{
                  p: { xs: 2, sm: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: isSmallScreen ? 'scale(1.01)' : 'scale(1.02)',
                    boxShadow: { xs: 2, sm: 3 }
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                  minHeight: { xs: 140, sm: 180, md: 200 },
                  textAlign: 'center'
                }}
                onClick={item.action}
                elevation={isMobile ? 1 : 2}
              >
                <Box sx={{ color: item.color, mb: { xs: 1, sm: 2 } }}>
                  {item.icon}
                </Box>
                <Typography 
                  variant={isMobile ? 'h6' : 'h5'} 
                  component="h2" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                    fontWeight: 500
                  }}
                >
                  {item.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    display: { xs: 'none', sm: 'block' },
                    fontSize: { sm: '0.875rem', md: '1rem' }
                  }}
                >
                  {item.description}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    display: { xs: 'block', sm: 'none' },
                    mt: 0.5
                  }}
                >
                  {item.shortDescription}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Mobile Quick Actions */}
        {isMobile && (
          <Box sx={{ position: 'fixed', bottom: 24, right: 16, zIndex: 1000 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {quickActions.map((action, index) => (
                <Fab
                  key={index}
                  size="medium"
                  onClick={action.action}
                  sx={{
                    bgcolor: action.color,
                    color: 'white',
                    '&:hover': {
                      bgcolor: action.color,
                      opacity: 0.9
                    },
                    boxShadow: 2,
                    width: 48,
                    height: 48
                  }}
                >
                  {action.icon}
                </Fab>
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
};

export default Dashboard;