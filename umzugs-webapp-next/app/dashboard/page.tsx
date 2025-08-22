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
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
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
      description: 'Bestehenden Kunden finden',
      icon: <SearchIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/search-customer',
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Neuer Kunde',
      description: 'Kunden anlegen',
      icon: <AddIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/new-customer',
      color: '#43e97b',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      title: 'Angebote',
      description: 'Angebote verwalten',
      icon: <DescriptionIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/quotes',
      color: '#fa709a',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      title: 'Buchhaltung',
      description: 'Rechnungen & Zahlungen',
      icon: <ReceiptIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/accounting',
      color: '#f093fb',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Kalender',
      description: 'Termine',
      icon: <CalendarIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/calendar',
      color: '#4facfe',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: 'Vertrieb',
      description: 'Verkauf',
      icon: <SalesIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/sales',
      color: '#fa709a',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      title: 'Admin Tools',
      description: 'Verwaltung',
      icon: <AdminIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/admin-tools',
      color: '#ffecd2',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    },
    {
      title: 'E-Mail',
      description: 'E-Mails',
      icon: <EmailIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/email-client',
      color: '#a8edea',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    },
    {
      title: 'WhatsApp',
      description: 'WhatsApp Nachrichten',
      icon: <WhatsAppIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/whatsapp',
      color: '#25D366',
      gradient: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
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
        {/* Top App Bar */}
        <AppBar position="fixed" sx={{ zIndex: muiTheme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              RELOCATO® CRM
            </Typography>
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <NotificationsIcon />
            </IconButton>
            <IconButton color="inherit">
              <SyncIcon />
            </IconButton>
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

            {/* Migration Success Message */}
            <Paper sx={{ mt: 4, p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                ✅ Next.js 15.5 Migration Erfolgreich!
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="h6">🚀 Turbopack</Typography>
                  <Typography variant="body2">40% schnellere Builds</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="h6">⚡ React 19</Typography>
                  <Typography variant="body2">Server Components</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="h6">🔒 TypeScript</Typography>
                  <Typography variant="body2">Strict Mode</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="h6">📱 Responsive</Typography>
                  <Typography variant="body2">Mobile-optimiert</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;