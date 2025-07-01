import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box, AppBar, Toolbar, Card, CardContent, useTheme, useMediaQuery, Fab } from '@mui/material';
import Grid from './GridCompat';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  Assignment as DispositionIcon,
  PhotoLibrary as PhotoIcon,
  TrendingUp as SalesIcon,
  AdminPanelSettings as AdminIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import MobileLayout from './MobileLayout';
import SyncStatus from './SyncStatus';
import LogoutButton from './LogoutButton';
import NotificationCenter from './NotificationCenter';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const dashboardItems = [
    {
      title: 'Kunde suchen',
      description: 'Bestehenden Kunden finden',
      icon: <SearchIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/search-customer',
      color: 'primary.main',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Neuer Kunde',
      description: 'Kunden anlegen',
      icon: <AddIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/new-customer',
      color: 'success.main',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      title: 'Angebote',
      description: 'Angebote verwalten',
      icon: <DescriptionIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/quotes',
      color: 'warning.main',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      title: 'Buchhaltung',
      description: 'Rechnungen & Zahlungen',
      icon: <ReceiptIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/accounting',
      color: 'error.main',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Kalender',
      description: 'Termine',
      icon: <CalendarIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/calendar',
      color: 'info.main',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: 'Vertrieb',
      description: 'Verkauf',
      icon: <SalesIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/sales',
      color: 'secondary.main',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      title: 'Admin Tools',
      description: 'Verwaltung',
      icon: <AdminIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/admin-tools',
      color: 'warning.main',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    },
    {
      title: 'E-Mail',
      description: 'E-Mails',
      icon: <EmailIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/email-client',
      color: 'info.main',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    }
  ];

  const rightActions = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <NotificationCenter />
      <SyncStatus />
      <LogoutButton />
    </Box>
  );

  const dashboardContent = (
    <>
      {!isMobile && (
        <AppBar position="sticky" elevation={0} sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Dashboard
            </Typography>
            {rightActions}
          </Toolbar>
        </AppBar>
      )}

      {/* Dashboard Content */}
      <Container maxWidth="lg" sx={{ mt: isMobile ? 2 : 4, mb: 4, px: isMobile ? 2 : 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom sx={{ fontWeight: 'bold' }}>
              Willkommen zurück!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: isMobile ? 3 : 4, fontSize: isMobile ? '0.9rem' : '1rem' }}>
              {isMobile 
                ? new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
                : `Hier ist Ihre Übersicht für heute, ${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}`
              }
            </Typography>
          </motion.div>
          
          <Grid container spacing={isMobile ? 2 : 3} sx={{ justifyContent: 'center' }}>
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
                        boxShadow: isMobile ? theme.shadows[2] : theme.shadows[8],
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
                    onClick={() => navigate(item.path)}
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
    </>
  );

  // Return with MobileLayout wrapper
  return (
    <MobileLayout 
      title="Dashboard" 
      showBottomNav={true}
      rightActions={isMobile ? rightActions : null}
    >
      {dashboardContent}
    </MobileLayout>
  );
};

export default Dashboard;