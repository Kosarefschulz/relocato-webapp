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
import NavigationMenu from './NavigationMenu';
import MobileLayout from './MobileLayout';
import SyncStatus from './SyncStatus';
import LogoutButton from './LogoutButton';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    },
    {
      title: 'E-Mail Client',
      description: 'E-Mails verwalten und importieren',
      icon: <EmailIcon sx={{ fontSize: 32 }} />,
      path: '/email-client',
      color: 'info.main',
      stats: { label: 'Ungelesen', value: '0' }
    }
  ];

  const rightActions = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          
          <Grid container spacing={isMobile ? 2 : 3}>
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
                      height: '100%',
                      '&:hover': {
                        transform: isMobile ? 'none' : 'translateY(-4px)',
                        boxShadow: isMobile ? theme.shadows[2] : theme.shadows[4]
                      },
                      '&:active': isMobile ? {
                        transform: 'scale(0.98)',
                        transition: 'transform 0.1s'
                      } : {}
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