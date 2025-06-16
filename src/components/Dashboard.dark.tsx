import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  alpha,
  Card,
  useMediaQuery,
  Grid,
} from '@mui/material';
import { 
  Search as SearchIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  Sell as SellIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import DarkModeToggle from './DarkModeToggle';
import SalesOverview from './SalesOverview';
import Logo from './Logo';
import SearchBar from './SearchBar';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [bottomNavValue, setBottomNavValue] = useState('dashboard');

  const navigationItems = [
    {
      label: 'Disposition',
      value: 'disposition',
      icon: <AssignmentIcon />,
      action: () => navigate('/disposition'),
      color: theme.palette.primary.main,
    },
    {
      label: 'Verkauf',
      value: 'sales',
      icon: <SellIcon />,
      action: () => navigate('/sales'),
      color: theme.palette.info.main,
    },
    {
      label: 'Angebote',
      value: 'quotes',
      icon: <DescriptionIcon />,
      action: () => navigate('/quotes'),
      color: theme.palette.warning.main,
    },
    {
      label: 'Kunden',
      value: 'customers',
      icon: <PeopleIcon />,
      action: () => navigate('/customers'),
      color: theme.palette.secondary.main,
    },
    {
      label: 'Kalender',
      value: 'calendar',
      icon: <CalendarIcon />,
      action: () => navigate('/calendar'),
      color: theme.palette.success.main,
    },
    {
      label: 'Rechnungen',
      value: 'invoices',
      icon: <ReceiptIcon />,
      action: () => navigate('/invoices'),
      color: theme.palette.error.main,
    },
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default,
      transition: 'background-color 0.3s ease'
    }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          transition: 'all 0.3s ease',
          pt: { xs: 'env(safe-area-inset-top)', sm: 0 },
        }}
      >
        <Toolbar sx={{ 
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 2, sm: 3 }
        }}>
          <Box sx={{ flexGrow: 1 }}>
            <Logo size="medium" showText={true} />
          </Box>
          
          {/* Search Bar */}
          <SearchBar />
          
          {/* Dark Mode Toggle */}
          <Box sx={{ ml: 1 }}>
            <DarkModeToggle />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container 
        component="main" 
        maxWidth="lg"
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          pt: { xs: 10, sm: 8 },
          pb: { xs: 12, sm: 10 },
          px: { xs: 2, sm: 3 },
          maxWidth: '100vw',
          overflowX: 'hidden',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Typography 
                variant={isMobile ? "h4" : "h3"} 
                sx={{ 
                  fontWeight: 800, 
                  mb: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Willkommen bei Relocato
              </Typography>
            </motion.div>
            <Typography variant="h6" color="text.secondary">
              Wählen Sie eine Option aus dem Menü unten
            </Typography>
          </Box>

          {/* Quick Action Cards for Desktop */}
          <Box 
            sx={{ 
              display: { xs: 'none', md: 'grid' },
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 3,
              mb: 4,
            }}
          >
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.value}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    p: 4,
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows?.[8] || '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
                      borderColor: item.color,
                      '& .icon-wrapper': {
                        transform: 'scale(1.1) rotate(5deg)',
                      }
                    },
                  }}
                  onClick={item.action}
                >
                  <Box
                    className="icon-wrapper"
                    sx={{
                      color: item.color,
                      mb: 2,
                      transition: 'transform 0.3s ease',
                      '& svg': {
                        fontSize: 48,
                      },
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                </Card>
              </motion.div>
            ))}
          </Box>

          {/* Mobile Cards */}
          <Box 
            sx={{ 
              display: { xs: 'grid', md: 'none' },
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1.5,
              width: '100%',
              maxWidth: '100%',
              px: 0,
            }}
          >
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.value}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                  onClick={item.action}
                >
                  <Box
                    sx={{
                      color: item.color,
                      mb: 1,
                      '& svg': {
                        fontSize: 36,
                      },
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                </Card>
              </motion.div>
            ))}
          </Box>
        </motion.div>
      </Container>

      {/* Bottom Navigation for Mobile */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0,
          zIndex: 1200,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          pb: 'env(safe-area-inset-bottom)',
        }} 
        elevation={0}
      >
        <BottomNavigation
          value={bottomNavValue}
          onChange={(event, newValue) => {
            setBottomNavValue(newValue);
            const item = navigationItems.find(i => i.value === newValue);
            if (item) {
              item.action();
            }
          }}
          sx={{
            backgroundColor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 12px 8px',
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            },
          }}
        >
          {navigationItems.map((item) => (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default Dashboard;