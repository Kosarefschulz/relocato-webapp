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
  TextField,
  InputAdornment,
  Paper,
  Alert,
  Chip,
  Avatar,
  Badge,
  Fab
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
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  AutoAwesome as AIIcon,
  Bolt as BoltIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#a72608', // Rufous - Elegant rust red
      light: '#d4471c',
      dark: '#821e06',
    },
    secondary: {
      main: '#bbc5aa', // Ash Gray - Natural green-gray
      light: '#d1dbbf',
      dark: '#a5af94',
    },
    background: {
      default: '#e6eed6', // Beige - Soft warm background
      paper: '#dde2c6', // Beige-2 - Paper surface
    },
    text: {
      primary: '#090c02', // Smoky Black - Deep contrast
      secondary: '#bbc5aa', // Ash Gray for secondary text
    },
    success: {
      main: '#bbc5aa',
      light: '#d1dbbf',
    },
    warning: {
      main: '#a72608',
      light: '#d4471c',
    },
    error: {
      main: '#a72608',
      light: '#d4471c',
    },
    divider: 'rgba(9, 12, 2, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em', color: '#090c02' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em', color: '#090c02' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em', color: '#090c02' },
  },
  shape: { borderRadius: 20 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(221, 226, 198, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(187, 197, 170, 0.3)',
          boxShadow: '0 8px 32px rgba(9, 12, 2, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(221, 226, 198, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(187, 197, 170, 0.2)',
        },
      },
    },
  },
});

const ModernDashboard: React.FC = () => {
  const router = useRouter();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');

  const dashboardItems = [
    {
      title: 'Kunde suchen',
      description: 'KI-gestützte Kundensuche',
      icon: <SearchIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/search-customer',
      color: '#a72608',
      gradient: 'linear-gradient(135deg, #a72608 0%, #bbc5aa 100%)',
      glow: '0 20px 40px -12px rgba(167, 38, 8, 0.3)',
      badge: 'AI',
      badgeColor: '#a72608'
    },
    {
      title: 'Neuer Kunde',
      description: 'Schnell Kunden erfassen',
      icon: <AddIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/new-customer',
      color: '#bbc5aa',
      gradient: 'linear-gradient(135deg, #bbc5aa 0%, #e6eed6 100%)',
      glow: '0 20px 40px -12px rgba(187, 197, 170, 0.4)',
      badge: 'QUICK',
      badgeColor: '#bbc5aa'
    },
    {
      title: 'Angebote',
      description: 'Intelligente Angebotserstellung',
      icon: <DescriptionIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/quotes',
      color: '#dde2c6',
      gradient: 'linear-gradient(135deg, #dde2c6 0%, #bbc5aa 100%)',
      glow: '0 20px 40px -12px rgba(221, 226, 198, 0.4)',
      count: 12
    },
    {
      title: 'Buchhaltung',
      description: 'Automatisierte Rechnungen',
      icon: <ReceiptIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/accounting',
      color: '#a72608',
      gradient: 'linear-gradient(135deg, #a72608 0%, #dde2c6 100%)',
      glow: '0 20px 40px -12px rgba(167, 38, 8, 0.3)',
      count: 5
    },
    {
      title: 'Kalender',
      description: 'Smart Terminplanung',
      icon: <CalendarIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/calendar',
      color: '#bbc5aa',
      gradient: 'linear-gradient(135deg, #bbc5aa 0%, #e6eed6 100%)',
      glow: '0 20px 40px -12px rgba(187, 197, 170, 0.4)',
      count: 3
    },
    {
      title: 'Vertrieb',
      description: 'Sales Analytics',
      icon: <SalesIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/sales',
      color: '#a72608',
      gradient: 'linear-gradient(135deg, #a72608 0%, #bbc5aa 100%)',
      glow: '0 20px 40px -12px rgba(167, 38, 8, 0.3)',
      badge: 'PRO',
      badgeColor: '#a72608'
    },
    {
      title: 'Admin Tools',
      description: 'System Management',
      icon: <AdminIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/admin-tools',
      color: '#090c02',
      gradient: 'linear-gradient(135deg, #090c02 0%, #bbc5aa 100%)',
      glow: '0 20px 40px -12px rgba(9, 12, 2, 0.4)',
      badge: 'ADMIN',
      badgeColor: '#090c02'
    },
    {
      title: 'E-Mail',
      description: 'Unified Inbox',
      icon: <EmailIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/email-client',
      color: '#dde2c6',
      gradient: 'linear-gradient(135deg, #dde2c6 0%, #bbc5aa 100%)',
      glow: '0 20px 40px -12px rgba(221, 226, 198, 0.4)',
      count: 7
    },
    {
      title: 'WhatsApp',
      description: 'Business Messaging',
      icon: <WhatsAppIcon sx={{ fontSize: { xs: 36, sm: 40, md: 48 } }} />,
      path: '/whatsapp',
      color: '#bbc5aa',
      gradient: 'linear-gradient(135deg, #bbc5aa 0%, #a72608 100%)',
      glow: '0 20px 40px -12px rgba(187, 197, 170, 0.4)',
      count: 2
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Cinematic Video Background */}
      <Box sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}>
        
        {/* Background Video */}
        <Box
          component="video"
          autoPlay
          loop
          muted
          playsInline
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
          }}
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </Box>

        {/* Video Overlay for better readability */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(230, 238, 214, 0.4) 0%, rgba(221, 226, 198, 0.5) 50%, rgba(187, 197, 170, 0.4) 100%)',
            backdropFilter: 'blur(2px)',
            zIndex: 2,
          }}
        />
        
        {/* Additional subtle overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(187, 197, 170, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(167, 38, 8, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(230, 238, 214, 0.3) 0%, transparent 50%)
            `,
            zIndex: 3,
          }}
        />
        
        {/* Floating Header */}
        <Box sx={{ position: 'relative', zIndex: 20 }}>
          <Container maxWidth="lg" sx={{ pt: 4 }}>
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Paper 
                elevation={0}
                sx={{
                  p: 4,
                  mb: 4,
                  background: 'linear-gradient(135deg, rgba(221, 226, 198, 0.85) 0%, rgba(187, 197, 170, 0.9) 100%)',
                  backdropFilter: 'blur(25px)',
                  borderRadius: 5,
                  border: '1px solid rgba(187, 197, 170, 0.4)',
                  boxShadow: '0 25px 50px -12px rgba(9, 12, 2, 0.2)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #090c02 0%, #a72608 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        textShadow: '0 2px 4px rgba(9, 12, 2, 0.2)',
                        mb: 1
                      }}
                    >
                      Willkommen zurück! 🌿
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#090c02',
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        opacity: 0.8
                      }}
                    >
                      {new Date().toLocaleDateString('de-DE', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton 
                      sx={{ 
                        backgroundColor: 'rgba(187, 197, 170, 0.2)',
                        color: '#090c02',
                        borderRadius: 3,
                        border: '1px solid rgba(187, 197, 170, 0.4)',
                        '&:hover': {
                          backgroundColor: 'rgba(187, 197, 170, 0.3)',
                          transform: 'scale(1.1)',
                          boxShadow: '0 8px 25px rgba(187, 197, 170, 0.4)',
                        }
                      }}
                    >
                      <Badge badgeContent={4} sx={{ '& .MuiBadge-badge': { backgroundColor: '#a72608', color: '#e6eed6' } }}>
                        <NotificationsIcon />
                      </Badge>
                    </IconButton>
                    
                    <IconButton 
                      sx={{ 
                        backgroundColor: 'rgba(167, 38, 8, 0.1)',
                        color: '#a72608',
                        borderRadius: 3,
                        border: '1px solid rgba(167, 38, 8, 0.3)',
                        '&:hover': {
                          backgroundColor: 'rgba(167, 38, 8, 0.2)',
                          transform: 'scale(1.1)',
                          boxShadow: '0 8px 25px rgba(167, 38, 8, 0.3)',
                        }
                      }}
                    >
                      <SyncIcon />
                    </IconButton>
                    
                    <Avatar 
                      sx={{ 
                        background: 'linear-gradient(135deg, #bbc5aa 0%, #a72608 100%)',
                        color: '#e6eed6',
                        border: '2px solid rgba(187, 197, 170, 0.4)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        boxShadow: '0 8px 25px rgba(187, 197, 170, 0.3)',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(5deg)',
                          boxShadow: '0 12px 35px rgba(167, 38, 8, 0.4)',
                        }
                      }}
                    >
                      RS
                    </Avatar>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Container>
        </Box>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 20, pb: 6 }}>
          
          {/* Modern Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Paper 
              elevation={0}
              sx={{
                p: 2,
                mb: 4,
                background: 'linear-gradient(135deg, rgba(221, 226, 198, 0.9) 0%, rgba(187, 197, 170, 0.85) 100%)',
                backdropFilter: 'blur(25px)',
                borderRadius: 4,
                border: '1px solid rgba(187, 197, 170, 0.4)',
                boxShadow: '0 15px 35px rgba(9, 12, 2, 0.15)',
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="🤖 KI-Search: Fragen Sie mich alles über Ihre Kunden, Angebote..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AIIcon sx={{ color: '#a72608' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: 'rgba(230, 238, 214, 0.9)',
                    borderRadius: 3,
                    border: '1px solid rgba(187, 197, 170, 0.4)',
                    color: '#090c02',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: '2px solid #a72608',
                    },
                    boxShadow: '0 8px 25px rgba(9, 12, 2, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(230, 238, 214, 0.95)',
                      borderColor: 'rgba(167, 38, 8, 0.3)',
                    },
                    '& input::placeholder': {
                      color: '#bbc5aa',
                    }
                  }
                }}
              />
            </Paper>
          </motion.div>

          {/* Accepted Quotes - Modern Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Paper 
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box 
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #c1bdb3 0%, #7f7979 100%)',
                    color: '#323031',
                    boxShadow: '0 8px 25px rgba(193, 189, 179, 0.3)'
                  }}
                >
                  <CheckCircleIcon />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: '#c1bdb3', fontWeight: 700 }}>
                    Angenommene Angebote
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#7f7979' }}>
                    Aktive Aufträge bereit zur Bearbeitung
                  </Typography>
                </Box>
                <Chip 
                  label="3 AKTIV" 
                  size="small" 
                  sx={{
                    ml: 'auto',
                    background: 'linear-gradient(135deg, #c1bdb3 0%, #7f7979 100%)',
                    color: '#323031',
                    border: '1px solid rgba(193, 189, 179, 0.3)',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(193, 189, 179, 0.3)',
                  }}
                />
              </Box>
              
              <Grid container spacing={2}>
                {[
                  { name: 'Familie Müller', date: '25.08.2025', price: '€1,250', urgent: true },
                  { name: 'Schmidt GmbH', date: '27.08.2025', price: '€2,100', urgent: false },
                  { name: 'Familie Weber', date: '30.08.2025', price: '€890', urgent: false }
                ].map((quote, i) => (
                  <Grid item xs={12} sm={4} key={i}>
                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        sx={{ 
                          background: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: 3,
                          border: quote.urgent ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.3)',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': quote.urgent ? {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            background: 'linear-gradient(90deg, #ef4444, #f87171)',
                          } : {}
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {quote.name}
                            </Typography>
                            {quote.urgent && (
                              <Chip 
                                label="URGENT" 
                                size="small" 
                                color="error"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {quote.date}
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 700 }}>
                            {quote.price}
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </motion.div>
          
          {/* Modern Dashboard Grid */}
          <Grid container spacing={3}>
            <AnimatePresence>
              {dashboardItems.map((item, index) => (
                <Grid item xs={6} sm={6} md={4} lg={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: 0.4 + (index * 0.1),
                      ease: "easeOut"
                    }}
                    whileHover={{ 
                      y: -8, 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      elevation={0}
                      sx={{ 
                        cursor: 'pointer',
                        height: '100%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 4,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.15)',
                          borderColor: 'rgba(255, 255, 255, 0.4)',
                          boxShadow: item.glow,
                          '& .icon-box': {
                            transform: 'scale(1.1) rotate(5deg)',
                            boxShadow: `0 20px 40px ${item.color}40`,
                          },
                          '& .card-title': {
                            color: 'white',
                          },
                          '& .floating-badge': {
                            transform: 'scale(1.1)',
                          }
                        }
                      }}
                      onClick={() => router.push(item.path)}
                    >
                      {/* Floating Badge */}
                      {(item.badge || item.count) && (
                        <Box
                          className="floating-badge"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 10,
                            transition: 'transform 0.3s ease',
                          }}
                        >
                          {item.badge ? (
                            <Chip 
                              label={item.badge}
                              size="small"
                              sx={{
                                backgroundColor: item.badgeColor || item.color,
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 24,
                                boxShadow: `0 4px 12px ${item.color}40`,
                              }}
                            />
                          ) : (
                            <Badge 
                              badgeContent={item.count} 
                              color="error"
                              sx={{
                                '& .MuiBadge-badge': {
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  fontWeight: 700,
                                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                                }
                              }}
                            >
                              <StarIcon sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                            </Badge>
                          )}
                        </Box>
                      )}

                      <CardContent sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        p: 4,
                        position: 'relative'
                      }}>
                        
                        {/* Modern Icon Box */}
                        <Box 
                          className="icon-box"
                          sx={{ 
                            width: { xs: 80, sm: 90, md: 110 },
                            height: { xs: 80, sm: 90, md: 110 },
                            borderRadius: '30px',
                            background: item.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            boxShadow: `0 15px 35px ${item.color}30`,
                            color: 'white',
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: -2,
                              left: -2,
                              right: -2,
                              bottom: -2,
                              background: item.gradient,
                              borderRadius: '32px',
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                              zIndex: -1
                            }
                          }}
                        >
                          {item.icon}
                        </Box>
                        
                        <Typography 
                          className="card-title"
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700,
                            mb: 1,
                            fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
                            color: 'white',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            transition: 'color 0.3s ease'
                          }}
                        >
                          {item.title}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                            lineHeight: 1.4,
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }}
                        >
                          {item.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        </Container>

        {/* Organic Floating Action Button */}
        <Fab
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 30,
            background: 'linear-gradient(135deg, #a72608 0%, #bbc5aa 100%)',
            color: '#e6eed6',
            boxShadow: '0 15px 35px rgba(167, 38, 8, 0.4)',
            border: '1px solid rgba(187, 197, 170, 0.3)',
            '&:hover': {
              transform: 'scale(1.15) rotate(10deg)',
              boxShadow: '0 20px 45px rgba(167, 38, 8, 0.6)',
              background: 'linear-gradient(135deg, #d4471c 0%, #d1dbbf 100%)',
            }
          }}
          onClick={() => router.push('/new-customer')}
        >
          <AddIcon sx={{ fontWeight: 'bold' }} />
        </Fab>
      </Box>
    </ThemeProvider>
  );
};

export default ModernDashboard;