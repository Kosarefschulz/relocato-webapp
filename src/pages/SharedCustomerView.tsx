import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  BusinessCenter as BusinessIcon,
  AccessTime as AccessTimeIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { shareTokenService, ShareToken } from '../services/shareTokenService';
import { Customer } from '../types';
import { databaseService } from '../config/database.config';
import CustomerInfo from '../components/CustomerInfo';
import CustomerPhotos from '../components/CustomerPhotos';
import CustomerTagsAndNotes from '../components/CustomerTagsAndNotes';

const SharedCustomerView: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<ShareToken | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (tokenId) {
      validateAndLoadCustomer();
    }
  }, [tokenId]);

  const validateAndLoadCustomer = async () => {
    try {
      setLoading(true);
      
      // Token validieren
      const validToken = await shareTokenService.validateToken(tokenId!);
      if (!validToken) {
        setError('Dieser Link ist ungültig oder abgelaufen.');
        return;
      }
      
      setToken(validToken);
      
      // Kundendaten laden
      const customersData = await databaseService.getCustomers();
      const customerData = customersData.find(c => c.id === validToken.customerId);
      
      if (!customerData) {
        setError('Kunde nicht gefunden.');
        return;
      }
      
      setCustomer(customerData);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Zugriff verweigert
          </Typography>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!customer || !token) {
    return null;
  }

  const daysRemaining = Math.ceil((token.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header mit Token-Info */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="body1">
              <strong>Temporärer Zugang</strong> - Freigegeben von {token.createdBy}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<AccessTimeIcon />}
              label={`Noch ${daysRemaining} Tage gültig`}
              color={daysRemaining <= 2 ? 'warning' : 'success'}
              size="small"
            />
            <Typography variant="caption" color="text.secondary">
              Gültig bis: {formatDate(token.expiresAt)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Kunden-Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                fontSize: '2rem',
                bgcolor: theme.palette.primary.main
              }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" gutterBottom>
                {customer.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Kundennummer: {customer.customerNumber}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Kontaktinfo Übersicht */}
          <List dense>
            {customer.phone && (
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText primary={customer.phone} />
              </ListItem>
            )}
            {customer.email && (
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary={customer.email} />
              </ListItem>
            )}
            {customer.fromAddress && (
              <ListItem>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Von"
                  secondary={customer.fromAddress}
                />
              </ListItem>
            )}
            {customer.toAddress && (
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Nach"
                  secondary={customer.toAddress}
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Tabs für verschiedene Bereiche */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Informationen" />
          {token.permissions.viewPhotos && <Tab label="Fotos" />}
          <Tab label="Notizen" />
        </Tabs>
      </Paper>

      {/* Tab-Inhalte */}
      <Paper sx={{ p: 3 }}>
        {activeTab === 0 && (
          <Box>
            <CustomerInfo 
              customer={customer} 
              editedCustomer={customer}
              editMode={false} 
              onFieldChange={() => {}}
              isMobile={false}
            />
          </Box>
        )}
        
        {token && token.permissions.viewQuote && quotes.length > 0 && activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Angebote & Arbeitsschein
            </Typography>
            {quotes.map((quote) => {
              const arbeitsscheinData = prepareArbeitsscheinData(quote, customer!);
              const arbeitsscheinHTML = generateArbeitsscheinHTML(arbeitsscheinData);
              
              return (
                <Card key={quote.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Angebot #{quote.id}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      Status: {quote.status === 'confirmed' ? 'Bestätigt' : 'Angenommen'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Erstellt: {new Date(quote.createdAt).toLocaleDateString('de-DE')}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="h6" gutterBottom>
                      Arbeitsschein
                    </Typography>
                    <Box 
                      sx={{ 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        p: 2,
                        maxHeight: 400,
                        overflow: 'auto'
                      }}
                      dangerouslySetInnerHTML={{ __html: arbeitsscheinHTML }}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
        
        {token.permissions.viewPhotos && activeTab === (token.permissions.viewQuote && quotes.length > 0 ? 2 : 1) && (
          <Box>
            <CustomerPhotos customer={customer} />
          </Box>
        )}
        
        {activeTab === (token.permissions.viewQuote && quotes.length > 0 ? (token.permissions.viewPhotos ? 3 : 2) : (token.permissions.viewPhotos ? 2 : 1)) && (
          <Box>
            <CustomerTagsAndNotes 
              customer={customer} 
              onUpdate={() => {}}
              readOnly={true}
            />
          </Box>
        )}
      </Paper>

      {/* Einschränkungen anzeigen */}
      {!token.permissions.viewQuote && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BlockIcon />
            <Typography>
              Angebote sind in dieser Ansicht nicht verfügbar
            </Typography>
          </Box>
        </Alert>
      )}
    </Container>
  );
};

export default SharedCustomerView;