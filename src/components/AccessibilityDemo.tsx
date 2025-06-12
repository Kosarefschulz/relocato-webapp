import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Switch,
  Slider,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Link,
  Breadcrumbs,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
} from '@mui/material';
import {
  Accessibility as AccessibilityIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Favorite as FavoriteIcon,
  BookmarkBorder as BookmarkBorderIcon,
  PlayArrow as PlayArrowIcon,
  VolumeUp as VolumeUpIcon,
} from '@mui/icons-material';
import { useAccessibility } from './AccessibilityProvider';
import AccessibilityToolbar, { AccessibilityStatus } from './AccessibilityToolbar';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

const AccessibilityDemo: React.FC = () => {
  const theme = useTheme();
  const { settings, announceToScreenReader } = useAccessibility();
  const [currentTab, setCurrentTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: '',
    newsletter: false,
    priority: 'medium',
    rating: 4,
  });

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    announceToScreenReader('Formular erfolgreich gesendet', 'assertive');
  };

  const sampleTableData = [
    { id: 1, name: 'Max Mustermann', email: 'max@example.com', status: 'Aktiv', score: 95 },
    { id: 2, name: 'Anna Schmidt', email: 'anna@example.com', status: 'Inaktiv', score: 87 },
    { id: 3, name: 'Peter Wagner', email: 'peter@example.com', status: 'Aktiv', score: 92 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Accessibility Status */}
      <AccessibilityStatus />
      
      {/* Skip to content link is automatically added by AccessibilityProvider */}
      
      {/* Main content with proper landmark */}
      <main id="main-content" tabIndex={-1}>
        {/* Header */}
        <SlideInContainer>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Accessibility (a11y) Compliance Demo
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Comprehensive accessibility features following WCAG 2.1 AA standards
            </Typography>
            
            {/* Breadcrumb Navigation */}
            <Breadcrumbs aria-label="Seitennavigation" sx={{ justifyContent: 'center', display: 'flex', mb: 4 }}>
              <Link color="inherit" href="/" aria-label="Zur Startseite">
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Start
              </Link>
              <Link color="inherit" href="/demos">
                Demos
              </Link>
              <Typography color="text.primary">Barrierefreiheit</Typography>
            </Breadcrumbs>
          </Box>
        </SlideInContainer>

        {/* Accessibility Features Overview */}
        <SlideInContainer delay={200}>
          <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
              Implementierte Barrierefreiheits-Features
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card elevation={1} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccessibilityIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h3">WCAG 2.1 AA</Typography>
                    </Box>
                    <Typography variant="body2">
                      Vollständige Konformität mit den Web Content Accessibility Guidelines 2.1 Level AA
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card elevation={1} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <VolumeUpIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h3">Screenreader</Typography>
                    </Box>
                    <Typography variant="body2">
                      Optimiert für NVDA, JAWS, VoiceOver und andere Screenreader-Software
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card elevation={1} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h3">Tastaturnavigation</Typography>
                    </Box>
                    <Typography variant="body2">
                      Vollständige Bedienbarkeit nur mit der Tastatur, inklusive Tab-Reihenfolge
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </SlideInContainer>

        {/* Interactive Tabs with proper ARIA */}
        <SlideInContainer delay={400}>
          <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
              Interaktive Komponenten
            </Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={currentTab} 
                onChange={(e, newValue) => setCurrentTab(newValue)}
                aria-label="Accessibility demo tabs"
              >
                <Tab label="Formulare" id="tab-0" aria-controls="tabpanel-0" />
                <Tab label="Tabellen" id="tab-1" aria-controls="tabpanel-1" />
                <Tab label="Medien" id="tab-2" aria-controls="tabpanel-2" />
                <Tab label="Navigation" id="tab-3" aria-controls="tabpanel-3" />
              </Tabs>
            </Box>

            {/* Tab Panel 0: Forms */}
            <Box
              role="tabpanel"
              hidden={currentTab !== 0}
              id="tabpanel-0"
              aria-labelledby="tab-0"
              sx={{ pt: 3 }}
            >
              {currentTab === 0 && (
                <form onSubmit={handleSubmit} noValidate>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        required
                        aria-describedby="name-helper"
                        helperText="Ihr vollständiger Name"
                        id="name-helper"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="E-Mail"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        required
                        aria-describedby="email-helper"
                        helperText="Ihre E-Mail-Adresse"
                        id="email-helper"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel id="service-label">Service auswählen</InputLabel>
                        <Select
                          labelId="service-label"
                          label="Service auswählen"
                          value={formData.service}
                          onChange={(e) => handleFormChange('service', e.target.value)}
                          aria-describedby="service-helper"
                        >
                          <MenuItem value="standard">Standardumzug</MenuItem>
                          <MenuItem value="premium">Premium-Umzug</MenuItem>
                          <MenuItem value="office">Büroumzug</MenuItem>
                        </Select>
                        <Typography variant="caption" id="service-helper">
                          Wählen Sie den gewünschten Umzugsservice
                        </Typography>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <FormLabel component="legend">Priorität</FormLabel>
                      <RadioGroup
                        value={formData.priority}
                        onChange={(e) => handleFormChange('priority', e.target.value)}
                        row
                        aria-label="Priorität auswählen"
                      >
                        <FormControlLabel value="low" control={<Radio />} label="Niedrig" />
                        <FormControlLabel value="medium" control={<Radio />} label="Normal" />
                        <FormControlLabel value="high" control={<Radio />} label="Hoch" />
                      </RadioGroup>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography component="legend" gutterBottom>
                        Bewertung: {formData.rating} von 5
                      </Typography>
                      <Slider
                        value={formData.rating}
                        onChange={(e, value) => handleFormChange('rating', value)}
                        min={1}
                        max={5}
                        step={1}
                        marks
                        aria-label="Bewertung von 1 bis 5"
                        valueLabelDisplay="auto"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.newsletter}
                            onChange={(e) => handleFormChange('newsletter', e.target.checked)}
                          />
                        }
                        label="Newsletter abonnieren"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        size="large"
                        aria-describedby="submit-help"
                      >
                        Formular absenden
                      </Button>
                      <Typography variant="caption" id="submit-help" sx={{ display: 'block', mt: 1 }}>
                        Durch Klicken werden Ihre Daten verarbeitet
                      </Typography>
                    </Grid>
                  </Grid>
                </form>
              )}
            </Box>

            {/* Tab Panel 1: Tables */}
            <Box
              role="tabpanel"
              hidden={currentTab !== 1}
              id="tabpanel-1"
              aria-labelledby="tab-1"
              sx={{ pt: 3 }}
            >
              {currentTab === 1 && (
                <TableContainer component={Paper} elevation={1}>
                  <Table aria-label="Beispiel-Datentabelle">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            ID
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Name
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            E-Mail
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Status
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Score
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Aktionen
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sampleTableData.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell component="th" scope="row">
                            {row.id}
                          </TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={row.status}
                              color={row.status === 'Aktiv' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{row.score}%</TableCell>
                          <TableCell>
                            <Tooltip title="Benutzer bearbeiten">
                              <IconButton 
                                size="small" 
                                aria-label={`${row.name} bearbeiten`}
                                onClick={() => announceToScreenReader(`${row.name} wird bearbeitet`)}
                              >
                                <PersonIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="E-Mail senden">
                              <IconButton 
                                size="small"
                                aria-label={`E-Mail an ${row.name} senden`}
                                onClick={() => announceToScreenReader(`E-Mail an ${row.name} wird gesendet`)}
                              >
                                <EmailIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {/* Tab Panel 2: Media */}
            <Box
              role="tabpanel"
              hidden={currentTab !== 2}
              id="tabpanel-2"
              aria-labelledby="tab-2"
              sx={{ pt: 3 }}
            >
              {currentTab === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card elevation={1}>
                      <CardContent>
                        <Typography variant="h6" component="h3" gutterBottom>
                          Bildbeispiel mit Alt-Text
                        </Typography>
                        <Box
                          component="img"
                          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjMwMCB4IDIwMDwvdGV4dD4KPC9zdmc+"
                          alt="Beispielbild für Accessibility-Demo: Ein grauer Platzhalter mit den Abmessungen 300x200 Pixel"
                          sx={{ width: '100%', height: 'auto', borderRadius: 1 }}
                        />
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          Dieses Bild hat einen aussagekräftigen Alt-Text für Screenreader.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card elevation={1}>
                      <CardContent>
                        <Typography variant="h6" component="h3" gutterBottom>
                          Audio-Steuerung
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <IconButton 
                            aria-label="Audio abspielen"
                            onClick={() => announceToScreenReader('Audio wird abgespielt')}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                          <Typography variant="body2">
                            Beispiel-Audio (stumm)
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          Audio-Steuerungen sind vollständig über die Tastatur bedienbar.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>

            {/* Tab Panel 3: Navigation */}
            <Box
              role="tabpanel"
              hidden={currentTab !== 3}
              id="tabpanel-3"
              aria-labelledby="tab-3"
              sx={{ pt: 3 }}
            >
              {currentTab === 3 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      Landmark Navigation
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="&lt;main&gt; Element"
                          secondary="Hauptinhalt ist klar definiert"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="&lt;nav&gt; Bereiche"
                          secondary="Navigation ist semantisch markiert"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Überschriften-Hierarchie"
                          secondary="H1-H6 in logischer Reihenfolge"
                        />
                      </ListItem>
                    </List>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      Tastatur-Shortcuts
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Chip label="Alt + S: Zum Hauptinhalt" size="small" variant="outlined" />
                      <Chip label="Alt + A: Accessibility-Menü" size="small" variant="outlined" />
                      <Chip label="Alt + H: Hoher Kontrast" size="small" variant="outlined" />
                      <Chip label="Tab: Nächstes Element" size="small" variant="outlined" />
                      <Chip label="Shift + Tab: Vorheriges Element" size="small" variant="outlined" />
                      <Chip label="Enter/Space: Aktivieren" size="small" variant="outlined" />
                    </Box>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Paper>
        </SlideInContainer>

        {/* Alert Examples */}
        <SlideInContainer delay={600}>
          <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
              Statusmeldungen und Alerts
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Erfolgreich!
                  </Typography>
                  Diese Nachricht wird automatisch von Screenreadern angekündigt.
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <Alert severity="warning" icon={<WarningIcon />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Warnung!
                  </Typography>
                  Wichtige Informationen mit angemessener ARIA-Rolle.
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <Alert severity="error" icon={<ErrorIcon />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Fehler!
                  </Typography>
                  Fehlermeldungen sind klar gekennzeichnet und fokussierbar.
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <Alert severity="info" icon={<InfoIcon />}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Information
                  </Typography>
                  Zusätzliche Informationen werden semantisch korrekt übermittelt.
                </Alert>
              </Grid>
            </Grid>
          </Paper>
        </SlideInContainer>

        {/* Accordion Example */}
        <SlideInContainer delay={800}>
          <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
              Expandierbare Inhalte
            </Typography>
            
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="accessibility-features-content"
                id="accessibility-features-header"
              >
                <Typography variant="h6">Implementierte Accessibility-Features</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  <ListItemButton>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="ARIA Labels und Beschreibungen"
                      secondary="Alle interaktiven Elemente haben aussagekräftige Labels"
                    />
                  </ListItemButton>
                  
                  <ListItemButton>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Farbkontrast WCAG AA"
                      secondary="Mindestens 4.5:1 Kontrastverhältnis für normalen Text"
                    />
                  </ListItemButton>
                  
                  <ListItemButton>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Tastaturnavigation"
                      secondary="Alle Funktionen über Tastatur erreichbar"
                    />
                  </ListItemButton>
                  
                  <ListItemButton>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Screenreader-Optimierung"
                      secondary="Semantische HTML-Struktur und ARIA-Attribute"
                    />
                  </ListItemButton>
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="testing-tools-content"
                id="testing-tools-header"
              >
                <Typography variant="h6">Empfohlene Testing-Tools</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  Die Accessibility-Features wurden mit folgenden Tools getestet:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="• NVDA Screenreader" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Chrome DevTools Accessibility Inspector" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• axe DevTools Browser Extension" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• WAVE Web Accessibility Evaluation Tool" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Lighthouse Accessibility Audit" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </SlideInContainer>

        {/* Call to Action */}
        <SlideInContainer delay={1000}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
              Testen Sie die Accessibility-Features
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              Nutzen Sie die Accessibility-Toolbar, um verschiedene Einstellungen zu testen. 
              Verwenden Sie Tab-Navigation, Screenreader oder probieren Sie die Tastenkürzel aus.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AccessibilityIcon />}
              onClick={() => announceToScreenReader('Accessibility-Einstellungen werden geöffnet')}
            >
              Accessibility-Einstellungen öffnen
            </Button>
          </Box>
        </SlideInContainer>
      </main>

      {/* Accessibility Toolbar */}
      <AccessibilityToolbar variant="fab" position="bottom-right" />
    </Box>
  );
};

export default AccessibilityDemo;