import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Try to import from App first, fallback to App.simple
let AuthContext: any;
try {
  AuthContext = require('../App').AuthContext;
} catch {
  AuthContext = require('../App.simple').AuthContext;
}
import {
  Container,
  Paper,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
  Chip,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  Logout as LogoutIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  AccountCircle as AccountCircleIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { glassmorphism, animations } from '../styles/modernTheme';

// Motion components
const MotionCard = motion(Card);
const MotionBox = motion(Box);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const dashboardItems = [
    {
      title: 'Kunde suchen',
      description: 'Bestehenden Kunden finden',
      icon: <SearchIcon sx={{ fontSize: 32 }} />,
      action: () => navigate('/search-customer'),
      color: theme.palette.secondary.main,
      gradient: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
    },
    {
      title: 'Neuer Kunde',
      description: 'Neuen Kunden anlegen',
      icon: <AddIcon sx={{ fontSize: 32 }} />,
      action: () => navigate('/new-customer'),
      color: theme.palette.success.main,
      gradient: `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
    },
    {
      title: 'Angebote',
      description: 'Alle versendeten Angebote',
      icon: <DescriptionIcon sx={{ fontSize: 32 }} />,
      action: () => navigate('/quotes'),
      color: theme.palette.warning.main,
      gradient: `linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main} 100%)`,
    },
    {
      title: 'Kunden',
      description: 'Kundenliste anzeigen',
      icon: <PeopleIcon sx={{ fontSize: 32 }} />,
      action: () => navigate('/customers'),
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
    },
    {
      title: 'Rechnungen',
      description: 'Alle Rechnungen anzeigen',
      icon: <ReceiptIcon sx={{ fontSize: 32 }} />,
      action: () => navigate('/invoices'),
      color: theme.palette.error.main,
      gradient: `linear-gradient(135deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 100%)`,
    }
  ];

  // Mock statistics
  const stats = [
    { label: 'Aktive Kunden', value: '24', change: '+12%', icon: <PeopleIcon /> },
    { label: 'Offene Angebote', value: '7', change: '+3%', icon: <ScheduleIcon /> },
    { label: 'Abgeschlossen', value: '18', change: '+25%', icon: <CheckCircleIcon /> },
    { label: 'Umsatz (Monat)', value: '€12.5k', change: '+18%', icon: <TrendingUpIcon /> },
  ];

  return (
    <>
      {/* Modern AppBar with glassmorphism */}
      <AppBar 
        position="static" 
        sx={{ 
          ...glassmorphism.light,
          borderBottom: 'none',
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Relocato
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
              Benutzer
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  background: theme.palette.secondary.main,
                  fontSize: '1rem',
                }}
              >
                U
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                },
              }}
            >
              <MenuItem onClick={handleClose} disabled>
                <AccountCircleIcon sx={{ mr: 2 }} />
                Benutzer
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 2 }} />
                Abmelden
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <MotionBox {...animations.fadeIn}>
          {/* Welcome Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
              {getGreeting()}, Benutzer!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Was möchten Sie heute erledigen?
            </Typography>
          </Box>

          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  sx={{
                    height: '100%',
                    background: theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box 
                        sx={{ 
                          p: 1, 
                          borderRadius: 2,
                          background: alpha(theme.palette.secondary.main, 0.1),
                          color: theme.palette.secondary.main,
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Chip
                        label={stat.change}
                        size="small"
                        sx={{
                          background: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>

          {/* Action Cards */}
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Schnellzugriff
          </Typography>
          
          <Grid container spacing={3}>
            {dashboardItems.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <MotionCard
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.action}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: item.gradient,
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    },
                    '&:hover::before': {
                      opacity: 0.05,
                    },
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Box 
                      sx={{ 
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: 2,
                        background: alpha(item.color, 0.1),
                        color: item.color,
                        mb: 2,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>

          {/* Activity Timeline (Optional) */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Letzte Aktivitäten
            </Typography>
            <Paper 
              sx={{ 
                p: 3,
                ...glassmorphism.light,
                border: 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} variant="indeterminate" />
                <Typography color="text.secondary">
                  Aktivitäten werden geladen...
                </Typography>
              </Box>
            </Paper>
          </Box>
        </MotionBox>
      </Container>
    </>
  );
};

export default Dashboard;