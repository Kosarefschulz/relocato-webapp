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
  InputBase,
  Fade,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Popover,
} from '@mui/material';
import { 
  Search as SearchIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

// Styled components
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}));

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [bottomNavValue, setBottomNavValue] = useState('dashboard');

  const navigationItems = [
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
      action: () => console.log('Kalender noch nicht implementiert'),
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Relocato
          </Typography>
          
          {/* Search - führt direkt zur Kundenliste */}
          <IconButton
            size="large"
            onClick={() => navigate('/customers')}
            color="inherit"
            sx={{ 
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }
            }}
          >
            <SearchIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container 
        component="main" 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          pt: 8,
          pb: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Willkommen bei Relocato
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Wählen Sie eine Option aus dem Menü unten
            </Typography>
          </Box>

          {/* Quick Action Cards for Desktop */}
          <Box 
            sx={{ 
              display: { xs: 'none', md: 'grid' },
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 3,
              mb: 4,
            }}
          >
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Paper
                  sx={{
                    p: 4,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={item.action}
                >
                  <Box
                    sx={{
                      color: item.color,
                      mb: 2,
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
                </Paper>
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
        }} 
        elevation={3}
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
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 12px 8px',
            },
            '& .Mui-selected': {
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.875rem',
                fontWeight: 600,
              },
            },
          }}
        >
          {navigationItems.map((item) => (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={item.icon}
              sx={{
                '&.Mui-selected': {
                  color: item.color,
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default Dashboard;