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
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  GetApp as GetAppIcon,
  Visibility as VisibilityIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Euro as EuroIcon
} from '@mui/icons-material';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';

interface Invoice {
  id?: string;
  quoteId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  price: number;
  taxAmount: number;
  totalPrice: number;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  createdAt: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}

const InvoicesList: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');

  // Load invoices
  useEffect(() => {
    loadInvoices();
  }, []);

  // Filter and search
  useEffect(() => {
    let filtered = invoices;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.quoteId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount_desc':
          return b.totalPrice - a.totalPrice;
        case 'amount_asc':
          return a.totalPrice - b.totalPrice;
        case 'due_date_asc':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'due_date_desc':
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        case 'customer_asc':
          return a.customerName.localeCompare(b.customerName);
        case 'customer_desc':
          return b.customerName.localeCompare(a.customerName);
        default:
          return 0;
      }
    });

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, statusFilter, sortBy]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load invoices from Google Sheets
      const invoices = await googleSheetsService.getInvoices();
      setInvoices(invoices);
      
    } catch (err) {
      setError('Fehler beim Laden der Rechnungen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'primary';
      case 'paid': return 'success';
      case 'overdue': return 'error';
      case 'cancelled': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'sent': return 'Versendet';
      case 'paid': return 'Bezahlt';
      case 'overdue': return 'Überfällig';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const isOverdue = (invoice: Invoice) => {
    return invoice.status === 'sent' && new Date() > new Date(invoice.dueDate);
  };

  // Statistics
  const totalInvoices = invoices.length;
  const totalValue = invoices.reduce((sum, invoice) => sum + invoice.totalPrice, 0);
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const paidValue = paidInvoices.reduce((sum, invoice) => sum + invoice.totalPrice, 0);
  const overdueInvoices = invoices.filter(i => isOverdue(i) || i.status === 'overdue');
  const overdueValue = overdueInvoices.reduce((sum, invoice) => sum + invoice.totalPrice, 0);

  const handleMarkAsPaid = async (invoice: Invoice) => {
    if (window.confirm(`Rechnung ${invoice.invoiceNumber} als bezahlt markieren?`)) {
      try {
        // Update invoice status
        console.log('Mark as paid:', invoice.invoiceNumber);
        // Refresh list
        await loadInvoices();
      } catch (err) {
        setError('Fehler beim Aktualisieren der Rechnung');
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom>
          Finance Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Rechnungsverwaltung und Finanzübersicht
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
                    {totalInvoices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rechnungen gesamt
                  </Typography>
                </Box>
                <ReceiptIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    €{totalValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gesamtumsatz
                  </Typography>
                </Box>
                <EuroIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                    €{paidValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Eingegangen ({paidInvoices.length})
                  </Typography>
                </Box>
                <AccountBalanceIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                    €{overdueValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Überfällig ({overdueInvoices.length})
                  </Typography>
                </Box>
                <PaymentIcon color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Suchen nach Kunde, Rechnungsnummer oder Angebots-ID..."
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

          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="draft">Entwurf</MenuItem>
                <MenuItem value="sent">Versendet</MenuItem>
                <MenuItem value="paid">Bezahlt</MenuItem>
                <MenuItem value="overdue">Überfällig</MenuItem>
                <MenuItem value="cancelled">Storniert</MenuItem>
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
                <MenuItem value="date_desc">Datum (neueste zuerst)</MenuItem>
                <MenuItem value="date_asc">Datum (älteste zuerst)</MenuItem>
                <MenuItem value="amount_desc">Betrag (höchste zuerst)</MenuItem>
                <MenuItem value="amount_asc">Betrag (niedrigste zuerst)</MenuItem>
                <MenuItem value="due_date_asc">Fälligkeit (nächste zuerst)</MenuItem>
                <MenuItem value="due_date_desc">Fälligkeit (späteste zuerst)</MenuItem>
                <MenuItem value="customer_asc">Kunde (A-Z)</MenuItem>
                <MenuItem value="customer_desc">Kunde (Z-A)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/quotes')}
              sx={{ height: 56 }}
            >
              Neue Rechnung erstellen
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

      {/* Invoices Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Rechnungsnummer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Kunde</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Netto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>MwSt</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Brutto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Erstellt</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fällig</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Keine Rechnungen gefunden
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {invoice.invoiceNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Angebot: {invoice.quoteId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {invoice.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        €{invoice.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        €{invoice.taxAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        €{invoice.totalPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(invoice.status)}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                      />
                      {isOverdue(invoice) && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                          Überfällig
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(invoice.createdAt).toLocaleDateString('de-DE')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={isOverdue(invoice) ? 'error' : 'text.primary'}
                        sx={{ fontWeight: isOverdue(invoice) ? 'bold' : 'normal' }}
                      >
                        {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          color="primary"
                          title="Anzeigen"
                          onClick={() => {
                            console.log('View invoice:', invoice.invoiceNumber);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          color="default"
                          title="Bearbeiten"
                          onClick={() => {
                            console.log('Edit invoice:', invoice.invoiceNumber);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          color="success"
                          title="E-Mail senden"
                          onClick={() => {
                            console.log('Send email for invoice:', invoice.invoiceNumber);
                          }}
                        >
                          <EmailIcon fontSize="small" />
                        </IconButton>
                        
                        <IconButton
                          size="small"
                          color="info"
                          title="PDF herunterladen"
                          onClick={() => {
                            console.log('Download PDF for invoice:', invoice.invoiceNumber);
                          }}
                        >
                          <GetAppIcon fontSize="small" />
                        </IconButton>
                        
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                          <IconButton
                            size="small"
                            color="warning"
                            title="Als bezahlt markieren"
                            onClick={() => handleMarkAsPaid(invoice)}
                          >
                            <PaymentIcon fontSize="small" />
                          </IconButton>
                        )}
                        
                        <IconButton
                          size="small"
                          color="error"
                          title="Löschen"
                          onClick={() => {
                            if (window.confirm('Rechnung wirklich löschen?')) {
                              console.log('Delete invoice:', invoice.invoiceNumber);
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Summary Footer */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {filteredInvoices.length} von {totalInvoices} Rechnungen angezeigt
          {filteredInvoices.length > 0 && (
            ` • Gesamtwert der angezeigten Rechnungen: €${filteredInvoices.reduce((sum, i) => sum + i.totalPrice, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}`
          )}
        </Typography>
      </Box>
    </Container>
  );
};

export default InvoicesList;