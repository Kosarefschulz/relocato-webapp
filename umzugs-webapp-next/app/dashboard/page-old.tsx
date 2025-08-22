'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Grid,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  TextField,
  InputAdornment,
  Paper,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  Assignment as DispositionIcon,
  TrendingUp as SalesIcon,
  AdminPanelSettings as AdminIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1', // Modern Indigo
      light: '#a5a6ff',
      dark: '#4338ca',
    },
    secondary: {
      main: '#06b6d4', // Modern Cyan
      light: '#67e8f9',
      dark: '#0891b2',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#6ee7b7',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    // ... rest of shadows
  ],
});

const Dashboard: React.FC = () => {
  const router = useRouter();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dashboardItems = [
    {
      title: 'Kunde suchen',
      description: 'KI-gestützte Kundensuche',
      icon: <SearchIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/search-customer',
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      glow: '0 20px 40px -12px rgba(99, 102, 241, 0.4)'
    },
    {
      title: 'Neuer Kunde',
      description: 'Schnell Kunden erfassen',
      icon: <AddIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/new-customer',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
      glow: '0 20px 40px -12px rgba(16, 185, 129, 0.4)'
    },
    {
      title: 'Angebote',
      description: 'Intelligente Angebotserstellung',
      icon: <DescriptionIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/quotes',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      glow: '0 20px 40px -12px rgba(245, 158, 11, 0.4)'
    },
    {
      title: 'Buchhaltung',
      description: 'Automatisierte Rechnungen',
      icon: <ReceiptIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/accounting',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
      glow: '0 20px 40px -12px rgba(239, 68, 68, 0.4)'
    },
    {
      title: 'Kalender',
      description: 'Smart Terminplanung',
      icon: <CalendarIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/calendar',
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      glow: '0 20px 40px -12px rgba(6, 182, 212, 0.4)'
    },
    {
      title: 'Vertrieb',
      description: 'Sales Analytics',
      icon: <SalesIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/sales',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
      glow: '0 20px 40px -12px rgba(139, 92, 246, 0.4)'
    },
    {
      title: 'Admin Tools',
      description: 'System Management',
      icon: <AdminIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/admin-tools',
      color: '#f97316',
      gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
      glow: '0 20px 40px -12px rgba(249, 115, 22, 0.4)'
    },
    {
      title: 'E-Mail',
      description: 'Unified Inbox',
      icon: <EmailIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/email-client',
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #67e8f9 100%)',
      glow: '0 20px 40px -12px rgba(6, 182, 212, 0.4)'
    },
    {
      title: 'WhatsApp',
      description: 'Business Messaging',
      icon: <WhatsAppIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/whatsapp',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      glow: '0 20px 40px -12px rgba(16, 185, 129, 0.4)'
    }
  ];

  const navigationItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Kunden', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Angebote', icon: <DescriptionIcon />, path: '/quotes' },
    { text: 'Kalender', icon: <CalendarIcon />, path: '/calendar' },
    { text: 'E-Mail', icon: <EmailIcon />, path: '/email-client' },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* Modern Glass Morphism App Bar */}
        <AppBar 
          position="fixed" 
          elevation={0}
          sx={{ 
            zIndex: muiTheme.zIndex.drawer + 1,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            color: 'text.primary'
          }}
        >
          <Toolbar sx={{ minHeight: 72 }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ 
                mr: 2,
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderRadius: 3,
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  transform: 'scale(1.05)',
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  letterSpacing: '-0.02em'
                }}
              >
                RELOCATO
              </Typography>
              <Box
                sx={{
                  ml: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                CRM
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                color="inherit" 
                sx={{ 
                  borderRadius: 3,
                  '&:hover': {
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    transform: 'scale(1.05)',
                  }
                }}
              >
                <NotificationsIcon />
              </IconButton>
              <IconButton 
                color="inherit"
                sx={{ 
                  borderRadius: 3,
                  '&:hover': {
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    transform: 'scale(1.05)',
                  }
                }}
              >
                <SyncIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Navigation Drawer */}
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            width: 240,
            '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Navigation
            </Typography>
          </Box>
          <List>
            {navigationItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <Link href={item.path} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                  <ListItemButton onClick={() => setDrawerOpen(false)}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </Link>
              </ListItem>
            ))}
          </List>
        </Drawer>

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          
          <Container maxWidth="lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant={isMobile ? "h5" : "h4"} gutterBottom sx={{ fontWeight: 'bold' }}>
                Willkommen zurück!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {`Hier ist Ihre Übersicht für heute, ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}`}
              </Typography>
            </motion.div>
            
            {/* Smart Search */}
            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="🔍 Smart Search - Kunden, Angebote, oder fragen Sie einfach..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'background.paper',
                  }
                }}
              />
            </Box>

            {/* Accepted Quotes Preview */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6">
                  Angenommene Angebote (3)
                </Typography>
              </Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                3 Angebote wurden angenommen und warten auf Bearbeitung
              </Alert>
              <Grid container spacing={2}>
                {[
                  { name: 'Familie Müller', date: '25.08.2025', price: '€1,250' },
                  { name: 'Schmidt GmbH', date: '27.08.2025', price: '€2,100' },
                  { name: 'Familie Weber', date: '30.08.2025', price: '€890' }
                ].map((quote, i) => (
                  <Grid item xs={12} sm={4} key={i}>
                    <Card sx={{ border: '1px solid', borderColor: 'success.main' }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {quote.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {quote.date}
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {quote.price}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
            
            {/* Dashboard Grid */}
            <Grid container spacing={isMobile ? 2 : 3}>
              {dashboardItems.map((item, index) => (
                <Grid item xs={6} sm={6} md={4} lg={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card 
                      elevation={0}
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        height: '100%',
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: isMobile ? 'none' : 'translateY(-8px)',
                          boxShadow: isMobile ? muiTheme.shadows[2] : muiTheme.shadows[8],
                          borderColor: item.color,
                          '& .icon-box': {
                            transform: 'scale(1.1)',
                          }
                        },
                        '&:active': isMobile ? {
                          transform: 'scale(0.98)',
                          transition: 'transform 0.1s'
                        } : {}
                      }}
                      onClick={() => router.push(item.path)}
                    >
                      <CardContent sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        p: isMobile ? 3 : 4
                      }}>
                        <Box 
                          className="icon-box"
                          sx={{ 
                            width: { xs: 70, sm: 80, md: 100 },
                            height: { xs: 70, sm: 80, md: 100 },
                            borderRadius: '50%',
                            background: item.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: { xs: 2, sm: 3 },
                            transition: 'transform 0.3s',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                            color: 'white'
                          }}
                        >
                          {item.icon}
                        </Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700,
                            mb: 1,
                            fontSize: isMobile ? '1.1rem' : '1.25rem'
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.95rem' },
                            display: { xs: 'none', sm: 'block' }
                          }}
                        >
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
    </ThemeProvider>
  );
};

export default Dashboard;