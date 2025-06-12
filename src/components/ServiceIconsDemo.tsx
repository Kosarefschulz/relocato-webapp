import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import { CustomIcons } from './CustomIcons';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';
import Logo, { BrandHeader, LogoWithBackground, ResponsiveLogo } from './LogoIntegration';

const ServiceIconsDemo: React.FC = () => {
  const theme = useTheme();

  const services = [
    {
      id: 'standard',
      name: 'Standardumzug',
      description: 'Kompletter Umzugsservice für Privatpersonen',
      icon: CustomIcons.Furniture,
      color: theme.palette.primary.main,
      price: 'ab €450',
    },
    {
      id: 'packing',
      name: 'Verpackungsservice',
      description: 'Professionelle Verpackung Ihrer Gegenstände',
      icon: CustomIcons.BoxPacking,
      color: theme.palette.secondary.main,
      price: 'ab €120',
    },
    {
      id: 'cleaning',
      name: 'Reinigungsservice',
      description: 'Endreinigung der alten Wohnung',
      icon: CustomIcons.Cleaning,
      color: theme.palette.success.main,
      price: 'ab €180',
    },
    {
      id: 'piano',
      name: 'Klaviertransport',
      description: 'Spezialtransport für Klaviere und Flügel',
      icon: CustomIcons.Piano,
      color: theme.palette.warning.main,
      price: 'ab €300',
    },
    {
      id: 'storage',
      name: 'Lagerung',
      description: 'Zwischenlagerung Ihrer Möbel',
      icon: CustomIcons.Storage,
      color: theme.palette.info.main,
      price: 'ab €80/Monat',
    },
    {
      id: 'office',
      name: 'Büroumzug',
      description: 'Komplette Büroumzüge für Unternehmen',
      icon: CustomIcons.Office,
      color: theme.palette.error.main,
      price: 'ab €800',
    },
  ];

  const logoVariants = [
    { variant: 'full' as const, title: 'Vollständiges Logo' },
    { variant: 'horizontal' as const, title: 'Horizontal' },
    { variant: 'icon' as const, title: 'Nur Icon' },
    { variant: 'text' as const, title: 'Nur Text' },
  ];

  const statusExamples = [
    { status: 'draft' as const, label: 'Entwurf' },
    { status: 'sent' as const, label: 'Versendet' },
    { status: 'accepted' as const, label: 'Angenommen' },
    { status: 'rejected' as const, label: 'Abgelehnt' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <SlideInContainer>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
            Custom Icons & Logo Integration
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Professionelle Icons und Branding für die relocato Umzugs-App
          </Typography>
        </Box>
      </SlideInContainer>

      {/* Logo Variations */}
      <SlideInContainer delay={200}>
        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            Logo Varianten
          </Typography>
          
          <Grid container spacing={4} sx={{ mb: 4 }}>
            {logoVariants.map((variant, index) => (
              <Grid item xs={12} sm={6} md={3} key={variant.variant}>
                <AnimatedCard delay={index * 100}>
                  <CardContent sx={{ textAlign: 'center', minHeight: 160 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      {variant.title}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Logo variant={variant.variant} size="medium" />
                    </Box>
                  </CardContent>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Brand Header Beispiele
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 3, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                  <BrandHeader size="medium" centered />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 3, backgroundColor: theme.palette.primary.main, borderRadius: 2 }}>
                  <BrandHeader size="medium" color="white" centered />
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Logo mit Hintergründen
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <LogoWithBackground variant="horizontal" pattern="gradient" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LogoWithBackground variant="horizontal" pattern="dots" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LogoWithBackground variant="horizontal" pattern="waves" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LogoWithBackground variant="horizontal" pattern="none" />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </SlideInContainer>

      {/* Service Icons */}
      <SlideInContainer delay={400}>
        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            Service Icons
          </Typography>
          
          <Grid container spacing={3}>
            {services.map((service, index) => (
              <Grid item xs={12} sm={6} md={4} key={service.id}>
                <AnimatedCard delay={index * 100}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${service.color} 0%, ${alpha(service.color, 0.8)} 100%)`,
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '30%',
                        height: '100%',
                        background: `radial-gradient(circle at center, ${alpha('#fff', 0.1)} 0%, transparent 70%)`,
                      },
                    }}
                  >
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {service.name}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                            {service.description}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {service.price}
                          </Typography>
                        </Box>
                        <Box sx={{ ml: 2 }}>
                          <service.icon sx={{ fontSize: 48, opacity: 0.9 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Box>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </SlideInContainer>

      {/* Status Icons */}
      <SlideInContainer delay={600}>
        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            Status Icons
          </Typography>
          
          <Grid container spacing={3}>
            {statusExamples.map((example, index) => (
              <Grid item xs={12} sm={6} md={3} key={example.status}>
                <AnimatedCard delay={index * 100}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ mb: 2 }}>
                      <CustomIcons.QuoteStatus 
                        status={example.status} 
                        sx={{ fontSize: 64 }}
                        color="primary"
                      />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {example.label}
                    </Typography>
                  </CardContent>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </SlideInContainer>

      {/* Interactive Elements */}
      <SlideInContainer delay={800}>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            Interaktive Elemente
          </Typography>
          
          <Grid container spacing={4}>
            {/* Progress Icon */}
            <Grid item xs={12} md={4}>
              <Card elevation={1}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Fortschrittsanzeige
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <CustomIcons.Progress progress={75} sx={{ fontSize: 80 }} color="primary" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    75% abgeschlossen
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Star Rating */}
            <Grid item xs={12} md={4}>
              <Card elevation={1}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Bewertung
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <CustomIcons.StarRating rating={4.5} sx={{ fontSize: 40 }} color="warning" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    4.5 von 5 Sternen
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Responsive Logo */}
            <Grid item xs={12} md={4}>
              <Card elevation={1}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Responsives Logo
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <ResponsiveLogo 
                      variant="horizontal"
                      breakpoints={{
                        xs: 'small',
                        sm: 'medium',
                        md: 'large',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Passt sich der Bildschirmgröße an
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </SlideInContainer>
    </Box>
  );
};

export default ServiceIconsDemo;