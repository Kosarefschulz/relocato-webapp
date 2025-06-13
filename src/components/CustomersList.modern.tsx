import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Avatar,
  useTheme,
  alpha,
  Skeleton,
  Fade,
  Tooltip,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Upload as UploadIcon,
  ContentCopy as ContentCopyIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Customer } from '../types';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';
import { motion, AnimatePresence } from 'framer-motion';
import { animations } from '../styles/modernTheme';

// Motion components
const MotionCard = motion(Card);
const MotionBox = motion(Box);

const CustomersList: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportData, setExportData] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const customers = await googleSheetsService.getCustomers();
        setCustomers(customers);
      } catch (error) {
        console.error('Fehler beim Laden der Kunden:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.id.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCustomer = (customer: Customer) => {
    navigate(`/customer-details/${customer.id}`, { state: { from: '/customers' } });
  };

  const isUpcomingMove = (movingDate: string) => {
    const moveDate = new Date(movingDate);
    const today = new Date();
    return moveDate > today;
  };

  const handleExportClick = () => {
    const csvData = googleSheetsService.exportLocalCustomersForSheets();
    setExportData(csvData);
    setExportDialogOpen(true);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setSnackbarMessage('Daten wurden in die Zwischenablage kopiert!');
      setSnackbarOpen(true);
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
      setSnackbarMessage('Fehler beim Kopieren in die Zwischenablage');
      setSnackbarOpen(true);
    }
  };

  const handleClearLocalCustomers = async () => {
    googleSheetsService.clearLocalCustomers();
    setExportDialogOpen(false);
    setSnackbarMessage('Lokale Kunden wurden gelöscht');
    setSnackbarOpen(true);
    const allCustomers = await googleSheetsService.getCustomers();
    setCustomers(allCustomers);
  };

  const hasLocalCustomers = customers.some(customer => customer.id.startsWith('local_'));

  // Get customer initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      '#8B5CF6',
      '#EC4899',
      '#06B6D4',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <MotionBox {...animations.fadeIn}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                Kunden
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {filteredCustomers.length} {filteredCustomers.length === 1 ? 'Kunde' : 'Kunden'} gefunden
              </Typography>
            </Box>
          </Box>

          {/* Search and Actions */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="Kunde suchen"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, ID oder Email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchTerm('')} edge="end" size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Tooltip title="Filter">
                  <IconButton 
                    sx={{ 
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                    }}
                  >
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
                {hasLocalCustomers && (
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={handleExportClick}
                    sx={{ minWidth: 200 }}
                  >
                    Export für Google Sheets
                  </Button>
                )}
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Customer Cards */}
        {loading ? (
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Skeleton variant="circular" width={56} height={56} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" height={32} />
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="80%" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <AnimatePresence>
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              {filteredCustomers.map((customer, index) => (
                <MotionCard
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => handleSelectCustomer(customer)}
                  sx={{
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    },
                    '&:hover::before': {
                      opacity: 1,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {/* Avatar */}
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          backgroundColor: getAvatarColor(customer.name),
                          fontSize: '1.25rem',
                          fontWeight: 600,
                        }}
                      >
                        {getInitials(customer.name)}
                      </Avatar>

                      {/* Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {customer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {customer.id}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {customer.id.startsWith('local_') && (
                              <Chip label="Lokal" size="small" color="warning" />
                            )}
                            {isUpcomingMove(customer.movingDate) && (
                              <Chip label="Bevorstehend" size="small" color="primary" />
                            )}
                            <Chip 
                              label={`${customer.apartment.rooms} Zimmer`} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        </Box>

                        {/* Contact Info */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {customer.email}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {customer.phone}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Addresses */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <LocationIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                Von: {customer.fromAddress}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                Nach: {customer.toAddress}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Footer */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="body2" color="primary" fontWeight={500}>
                              {new Date(customer.movingDate).toLocaleDateString('de-DE')}
                            </Typography>
                          </Box>
                          <Tooltip title="Angebot erstellen">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/create-quote', { state: { customer } });
                              }}
                              sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.16),
                                },
                              }}
                            >
                              <DescriptionIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </MotionCard>
              ))}
            </Box>
          </AnimatePresence>
        )}

        {!loading && filteredCustomers.length === 0 && (
          <Fade in>
            <Card sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm ? 'Keine Kunden gefunden' : 'Noch keine Kunden angelegt'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm 
                  ? 'Versuchen Sie einen anderen Suchbegriff'
                  : 'Legen Sie Ihren ersten Kunden an, um zu beginnen'
                }
              </Typography>
              {!searchTerm && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/new-customer')}
                >
                  Neuen Kunden anlegen
                </Button>
              )}
            </Card>
          </Fade>
        )}
      </MotionBox>

      {/* Export Dialog */}
      <Dialog 
        open={exportDialogOpen} 
        onClose={() => setExportDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Lokale Kunden für Google Sheets exportieren
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Kopieren Sie die folgenden Daten und fügen Sie sie in Ihr Google Sheet ein
          </Alert>
          <TextField
            multiline
            fullWidth
            value={exportData}
            rows={10}
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace', fontSize: '12px' }
            }}
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            Nach dem Export können Sie die lokalen Kunden löschen, um Duplikate zu vermeiden
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setExportDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleClearLocalCustomers}
            color="error"
          >
            Lokale Kunden löschen
          </Button>
          <Button 
            onClick={handleCopyToClipboard}
            variant="contained"
            startIcon={<ContentCopyIcon />}
          >
            In Zwischenablage kopieren
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default CustomersList;