import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  Logout as LogoutIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  AccountCircle as AccountCircleIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  Assignment as DispositionIcon,
  PhotoLibrary as PhotoIcon,
  TrendingUp as SalesIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import NavigationMenu from './NavigationMenu';
import SyncStatus from './SyncStatus';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const theme = useTheme();

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

  const dashboardItems = [
    {
      title: 'Kunde suchen',
      description: 'Bestehenden Kunden finden und Angebot erstellen',
      icon: <SearchIcon sx={{ fontSize: 32 }} />,
      path: '/search-customer',
      color: 'primary.main',
      stats: { label: 'Aktive Kunden', value: '248' }
    },
    {
      title: 'Neuer Kunde',
      description: 'Neuen Kunden anlegen',
      icon: <AddIcon sx={{ fontSize: 32 }} />,
      path: '/new-customer',
      color: 'success.main',
      stats: { label: 'Heute hinzugefügt', value: '3' }
    },
    {
      title: 'Angebote',
      description: 'Alle Angebote verwalten',
      icon: <DescriptionIcon sx={{ fontSize: 32 }} />,
      path: '/quotes',
      color: 'warning.main',
      stats: { label: 'Offene Angebote', value: '12' }
    },
    {
      title: 'Rechnungen',
      description: 'Rechnungen verwalten',
      icon: <ReceiptIcon sx={{ fontSize: 32 }} />,
      path: '/invoices',
      color: 'error.main',
      stats: { label: 'Unbezahlt', value: '7' }
    },
    {
      title: 'Kalender',
      description: 'Termine und Planung',
      icon: <CalendarIcon sx={{ fontSize: 32 }} />,
      path: '/calendar',
      color: 'info.main',
      stats: { label: 'Heute', value: '4' }
    },
    {
      title: 'Vertrieb',
      description: 'Verkaufsübersicht',
      icon: <SalesIcon sx={{ fontSize: 32 }} />,
      path: '/sales',
      color: 'secondary.main',
      stats: { label: 'Diesen Monat', value: '€ 48.320' }
    },
    {
      title: 'Admin Tools',
      description: 'Duplikate & E-Mail Import',
      icon: <AdminIcon sx={{ fontSize: 32 }} />,
      path: '/admin-tools',
      color: 'warning.main',
      stats: { label: 'Verwaltung', value: '3 Tools' }
    }
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Navigation Sidebar */}
      <NavigationMenu />
      
      {/* Main Content */}
      <Box sx={{ flexGrow: 1, backgroundColor: 'background.default' }}>
        {/* AppBar */}
        <AppBar position="sticky" elevation={0} sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Dashboard
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SyncStatus />
              <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                {user?.email}
              </Typography>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user?.email?.charAt(0).toUpperCase()}
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
              >
                <MenuItem onClick={handleClose} disabled>
                  <AccountCircleIcon sx={{ mr: 1 }} />
                  {user?.email}
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Abmelden
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Dashboard Content */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Willkommen zurück!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Hier ist Ihre Übersicht für heute, {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Typography>
          </motion.div>
          
          <Grid container spacing={3}>
            {dashboardItems.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4]
                      }
                    }}
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          bgcolor: `${item.color}15`,
                          color: item.color
                        }}>
                          {item.icon}
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {item.stats.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.stats.label}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;