import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  CalendarToday as CalendarTodayIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { Customer } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';

const CustomersList: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [filterBy, setFilterBy] = useState<string>('all');

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter and search
  useEffect(() => {
    let filtered = customers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.fromAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.toAddress.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    const now = new Date();
    if (filterBy !== 'all') {
      filtered = filtered.filter(customer => {
        if (!customer.movingDate) return filterBy === 'no_date';
        
        const movingDate = new Date(customer.movingDate);
        const diffDays = Math.ceil((movingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filterBy) {
          case 'upcoming_week':
            return diffDays >= 0 && diffDays <= 7;
          case 'upcoming_month':
            return diffDays >= 0 && diffDays <= 30;
          case 'past':
            return diffDays < 0;
          case 'no_date':
            return !customer.movingDate;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'date_asc':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'moving_date_asc':
          if (!a.movingDate && !b.movingDate) return 0;
          if (!a.movingDate) return 1;
          if (!b.movingDate) return -1;
          return new Date(a.movingDate).getTime() - new Date(b.movingDate).getTime();
        case 'moving_date_desc':
          if (!a.movingDate && !b.movingDate) return 0;
          if (!a.movingDate) return 1;
          if (!b.movingDate) return -1;
          return new Date(b.movingDate).getTime() - new Date(a.movingDate).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'area_desc':
          return (b.apartment?.area || 0) - (a.apartment?.area || 0);
        case 'area_asc':
          return (a.apartment?.area || 0) - (b.apartment?.area || 0);
        default:
          return 0;
      }
    });

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, sortBy, filterBy]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load customers from Google Sheets
      const customers = await googleSheetsService.getCustomers();
      setCustomers(customers);
      
    } catch (err) {
      setError('Fehler beim Laden der Kunden');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (window.confirm(`Kunde "${customer.name}" wirklich löschen?\n\nAlle zugehörigen Angebote und Rechnungen werden ebenfalls gelöscht.`)) {
      try {
        setLoading(true);
        const success = await googleSheetsService.deleteCustomer(customer.id);
        
        if (success) {
          // Refresh list
          await loadCustomers();
          console.log('✅ Kunde erfolgreich gelöscht:', customer.name);
        } else {
          setError('Fehler beim Löschen des Kunden');
        }
      } catch (err) {
        console.error('Fehler beim Löschen:', err);
        setError('Fehler beim Löschen des Kunden');
      } finally {
        setLoading(false);
      }
    }
  };

  const getMovingDateStatus = (movingDate: string) => {
    if (!movingDate) return { status: 'no_date', color: 'default', label: 'Kein Datum' };
    
    const now = new Date();
    const moving = new Date(movingDate);
    const diffDays = Math.ceil((moving.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'past', color: 'error', label: 'Vergangen' };
    } else if (diffDays <= 7) {
      return { status: 'urgent', color: 'warning', label: 'Diese Woche' };
    } else if (diffDays <= 30) {
      return { status: 'upcoming', color: 'info', label: 'Diesen Monat' };
    } else {
      return { status: 'future', color: 'success', label: 'Geplant' };
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Statistics
  const totalCustomers = customers.length;
  const upcomingMoves = customers.filter(c => {
    if (!c.movingDate) return false;
    const diffDays = Math.ceil((new Date(c.movingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;
  const avgArea = customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + (c.apartment?.area || 0), 0) / customers.length) : 0;
  const avgRooms = customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + (c.apartment?.rooms || 0), 0) / customers.length * 10) / 10 : 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Kundenverwaltung
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Alle Kunden im Überblick und verwalten
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {totalCustomers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Kunden gesamt
                  </Typography>
                </Box>
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {upcomingMoves}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Umzüge (30 Tage)
                  </Typography>
                </Box>
                <CalendarTodayIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {avgArea}m²
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ø Wohnfläche
                  </Typography>
                </Box>
                <HomeIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                    {avgRooms}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ø Zimmeranzahl
                  </Typography>
                </Box>
                <TrendingUpIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Suchen nach Name, E-Mail, Telefon oder Adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filterBy}
                label="Filter"
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <MenuItem value="all">Alle Kunden</MenuItem>
                <MenuItem value="upcoming_week">Diese Woche</MenuItem>
                <MenuItem value="upcoming_month">Dieser Monat</MenuItem>
                <MenuItem value="past">Vergangene Umzüge</MenuItem>
                <MenuItem value="no_date">Ohne Datum</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sortierung</InputLabel>
              <Select
                value={sortBy}
                label="Sortierung"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="date_desc">Erstellt (neueste zuerst)</MenuItem>
                <MenuItem value="date_asc">Erstellt (älteste zuerst)</MenuItem>
                <MenuItem value="moving_date_asc">Umzugsdatum (nächste zuerst)</MenuItem>
                <MenuItem value="moving_date_desc">Umzugsdatum (späteste zuerst)</MenuItem>
                <MenuItem value="name_asc">Name (A-Z)</MenuItem>
                <MenuItem value="name_desc">Name (Z-A)</MenuItem>
                <MenuItem value="area_desc">Wohnfläche (größte zuerst)</MenuItem>
                <MenuItem value="area_asc">Wohnfläche (kleinste zuerst)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/new-customer')}
              sx={{ height: 56 }}
            >
              Neuer Kunde
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Customers Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Kunde</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Kontakt</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Umzugsdatum</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Wohnung</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Adressen</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Keine Kunden gefunden
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => {
                  const movingStatus = getMovingDateStatus(customer.movingDate);
                  
                  return (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getInitials(customer.name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {customer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {customer.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {customer.email}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {customer.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        {customer.movingDate ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {new Date(customer.movingDate).toLocaleDateString('de-DE')}
                            </Typography>
                            <Chip
                              label={movingStatus.label}
                              color={movingStatus.color as any}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        ) : (
                          <Chip
                            label="Kein Datum"
                            color="default"
                            size="small"
                          />
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {customer.apartment?.rooms} Zimmer • {customer.apartment?.area} m²
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.apartment?.floor === 0 ? 'Erdgeschoss' : `${customer.apartment?.floor}. Stock`}
                          {customer.apartment?.hasElevator ? ' • Aufzug' : ' • Kein Aufzug'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 200, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 0.5
                          }}
                        >
                          <strong>Von:</strong> {customer.fromAddress}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 200, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <strong>Nach:</strong> {customer.toAddress}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            color="primary"
                            title="Details anzeigen"
                            onClick={() => navigate(`/customer-details/${customer.id}`)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          
                          <IconButton
                            size="small"
                            color="default"
                            title="Bearbeiten"
                            onClick={() => navigate(`/edit-customer/${customer.id}`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          
                          <IconButton
                            size="small"
                            color="success"
                            title="Angebot erstellen"
                            onClick={() => navigate('/create-quote', { state: { customer } })}
                          >
                            <AssignmentIcon fontSize="small" />
                          </IconButton>
                          
                          <IconButton
                            size="small"
                            color="error"
                            title="Löschen"
                            onClick={() => handleDeleteCustomer(customer)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary Footer */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {filteredCustomers.length} von {totalCustomers} Kunden angezeigt
        </Typography>
      </Box>
    </Container>
  );
};

export default CustomersList;