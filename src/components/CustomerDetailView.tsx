import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Badge,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarMonth,
  Home,
  Business,
  Edit,
  Add,
  LocalShipping,
  Euro,
  Assessment,
  History,
  Star,
  StarBorder,
  Flag,
  Message,
  Share,
  Print,
  MoreVert,
  Timeline,
  TrendingUp,
  AccountCircle,
  ContactPhone,
  Schedule,
  CheckCircle,
  Warning,
  Info,
  Assignment,
  Receipt,
  EventNote,
  Label,
  PhotoLibrary
} from '@mui/icons-material';
import { Customer, Quote, Invoice } from '../types';
import { databaseService } from '../config/database.config';
import CustomerPhotoGallery from './CustomerPhotoGallery';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const CustomerDetailView: React.FC = () => {
  const params = useParams<{ customerId?: string; id?: string }>();
  const customerId = params.customerId || params.id;
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [noteDialog, setNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState('general');

  useEffect(() => {
    if (!customerId) {
      setError('Keine Kunden-ID gefunden');
      setLoading(false);
      return;
    }
    
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Lade Kunde mit ID:', customerId);
      
      // Lade Kundendaten
      const customers = await databaseService.getCustomers();
      console.log('📊 Gefundene Kunden:', customers.length);
      console.log('🎯 Suche nach ID:', customerId);
      
      // Erweiterte Suche - auch nach customerNumber und anderen Feldern
      let foundCustomer = customers.find(c => 
        c.id === customerId || 
        c.customerNumber === customerId ||
        c.id.includes(customerId) ||
        (customerId && c.id.toLowerCase().includes(customerId.toLowerCase()))
      );
      
      // Falls nicht gefunden, versuche Lexware-ID Matching
      if (!foundCustomer && customerId?.startsWith('lexware-')) {
        const lexwareId = customerId.replace('lexware-', '');
        foundCustomer = customers.find(c => 
          c.id.includes(lexwareId) ||
          c.customerNumber?.includes(lexwareId) ||
          c.id === lexwareId
        );
        console.log('🔄 Lexware ID Suche:', lexwareId, foundCustomer ? 'GEFUNDEN' : 'NICHT GEFUNDEN');
      }
      
      if (!foundCustomer) {
        console.log('❌ Kunde nicht gefunden. Verfügbare IDs:', customers.map(c => c.id).slice(0, 5));
        setError(`Kunde mit ID "${customerId}" nicht gefunden`);
        return;
      }
      
      console.log('✅ Kunde gefunden:', foundCustomer.name);
      setCustomer(foundCustomer);
      
      // Lade Angebote und Rechnungen (simuliert)
      // TODO: Implementiere echte API-Aufrufe wenn verfügbar
      setQuotes([]);
      setInvoices([]);
      
    } catch (err) {
      console.error('Fehler beim Laden der Kundendaten:', err);
      setError('Fehler beim Laden der Kundendaten: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !customer) return;
    
    // TODO: Implementiere Notiz-Speicherung
    setNoteDialog(false);
    setNewNote('');
    setNoteCategory('general');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Kundendaten werden geladen...
        </Typography>
      </Container>
    );
  }

  if (error || !customer) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Gesuchte ID: {customerId}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            onClick={() => navigate('/customer-search')} 
            startIcon={<ArrowBack />}
            variant="contained"
          >
            Zurück zur Suche
          </Button>
          <Button 
            onClick={() => navigate('/customers')} 
            startIcon={<Person />}
            variant="outlined"
          >
            Alle Kunden anzeigen
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={() => navigate('/customer-search')} 
            sx={{ mr: 1 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Kundendetails
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Share />}
              size="small"
            >
              Teilen
            </Button>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              size="small"
            >
              Bearbeiten
            </Button>
            <IconButton>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Kundenübersicht Karte */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          mb: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'absolute', top: -50, right: -50, opacity: 0.1 }}>
          <Person sx={{ fontSize: 200 }} />
        </Box>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              sx={{ 
                width: 120, 
                height: 120, 
                fontSize: 48,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)'
              }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </Avatar>
          </Grid>
          
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h3" component="h2" sx={{ mr: 2, fontWeight: 'bold' }}>
                {customer.name}
              </Typography>
              {customer.priority && (
                <Chip
                  icon={<Flag />}
                  label={`${customer.priority.toUpperCase()} PRIORITÄT`}
                  color={getPriorityColor(customer.priority)}
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
              Kunde #{customer.id}
              {customer.customerNumber && ` • ${customer.customerNumber}`}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<CheckCircle />}
                label={customer.status || 'Aktiv'}
                color={getStatusColor(customer.status)}
                variant="filled"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              {customer.company && (
                <Chip
                  icon={<Business />}
                  label={customer.company}
                  variant="outlined"
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                />
              )}
              {customer.tags?.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                />
              ))}
            </Box>
          </Grid>
          
          <Grid item>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                €{customer.total?.toLocaleString('de-DE') || '0'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Gesamtwert
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
            onClick={() => navigate('/create-quote', { state: { customer } })}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Assignment color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">Angebot erstellen</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Email color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">E-Mail senden</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <EventNote color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">Termin planen</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}
            onClick={() => setNoteDialog(true)}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Add color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">Notiz hinzufügen</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Info />} label="Übersicht" />
          <Tab icon={<Assignment />} label="Angebote" />
          <Tab icon={<Receipt />} label="Rechnungen" />
          <Tab icon={<PhotoLibrary />} label="Fotos" />
          <Tab icon={<Message />} label="Kommunikation" />
          <Tab icon={<Timeline />} label="Aktivitäten" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Kontaktdaten */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <ContactPhone sx={{ mr: 1 }} />
                Kontaktinformationen
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon><Email color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="E-Mail" 
                    secondary={
                      <a href={`mailto:${customer.email}`} style={{ color: 'inherit' }}>
                        {customer.email}
                      </a>
                    } 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon><Phone color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Telefon" 
                    secondary={
                      <a href={`tel:${customer.phone}`} style={{ color: 'inherit' }}>
                        {customer.phone}
                      </a>
                    } 
                  />
                </ListItem>
                
                {customer.address && (
                  <ListItem>
                    <ListItemIcon><LocationOn color="primary" /></ListItemIcon>
                    <ListItemText primary="Adresse" secondary={customer.address} />
                  </ListItem>
                )}
                
                {customer.city && (
                  <ListItem>
                    <ListItemIcon><Home color="primary" /></ListItemIcon>
                    <ListItemText primary="Stadt" secondary={`${customer.zip || ''} ${customer.city}`} />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Umzugsdetails */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <LocalShipping sx={{ mr: 1 }} />
                Umzugsdetails
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon><CalendarMonth color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Umzugsdatum" 
                    secondary={new Date(customer.movingDate).toLocaleDateString('de-DE')} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon><LocationOn color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Von" 
                    secondary={customer.fromAddress} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon><LocationOn color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Nach" 
                    secondary={customer.toAddress} 
                  />
                </ListItem>
                
                {customer.apartment && (
                  <ListItem>
                    <ListItemIcon><Home color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Wohnung" 
                      secondary={`${customer.apartment.rooms} Zimmer, ${customer.apartment.area}m², ${customer.apartment.floor}. Etage${customer.apartment.hasElevator ? ' (Aufzug)' : ''}`} 
                    />
                  </ListItem>
                )}
                
                {customer.distance && (
                  <ListItem>
                    <ListItemIcon><TrendingUp color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Entfernung" 
                      secondary={`${customer.distance} km`} 
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Services */}
          {customer.services && customer.services.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Gewünschte Services
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {customer.services.map((service, index) => (
                    <Chip
                      key={index}
                      label={service}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Notizen */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Notizen
                </Typography>
                <Button
                  startIcon={<Add />}
                  onClick={() => setNoteDialog(true)}
                  size="small"
                >
                  Notiz hinzufügen
                </Button>
              </Box>
              
              {customer.notes ? (
                <Typography variant="body1" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                  {customer.notes}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Keine Notizen vorhanden
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Angebote</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/create-quote', { state: { customer } })}
            >
              Neues Angebot
            </Button>
          </Box>
          
          {quotes.length === 0 ? (
            <Alert severity="info">
              Noch keine Angebote erstellt. Erstellen Sie das erste Angebot für diesen Kunden.
            </Alert>
          ) : (
            <Box>
              {/* TODO: Angebote anzeigen */}
            </Box>
          )}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Rechnungen</Typography>
          
          {invoices.length === 0 ? (
            <Alert severity="info">
              Keine Rechnungen vorhanden.
            </Alert>
          ) : (
            <Box>
              {/* TODO: Rechnungen anzeigen */}
            </Box>
          )}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {customerId && <CustomerPhotoGallery customerId={customerId} />}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Kommunikationshistorie</Typography>
          
          <Alert severity="info">
            Kommunikationshistorie wird bald verfügbar sein.
          </Alert>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Aktivitäten</Typography>
          
          <Alert severity="info">
            Aktivitätsverlauf wird bald verfügbar sein.
          </Alert>
        </Paper>
      </TabPanel>

      {/* Notiz Dialog */}
      <Dialog open={noteDialog} onClose={() => setNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neue Notiz hinzufügen</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Kategorie</InputLabel>
            <Select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              label="Kategorie"
            >
              <MenuItem value="general">Allgemein</MenuItem>
              <MenuItem value="wichtig">Wichtig</MenuItem>
              <MenuItem value="besichtigung">Besichtigung</MenuItem>
              <MenuItem value="preisverhandlung">Preisverhandlung</MenuItem>
              <MenuItem value="sonstiges">Sonstiges</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notiz"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Geben Sie hier Ihre Notiz ein..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialog(false)}>Abbrechen</Button>
          <Button onClick={handleAddNote} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerDetailView;