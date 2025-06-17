import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Checkbox,
  Snackbar
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
  Euro as EuroIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  IndeterminateCheckBox as IndeterminateCheckBoxIcon
} from '@mui/icons-material';
import { databaseService as googleSheetsService } from '../config/database.config';
import { generateInvoicePDF } from '../services/pdfService';
import { Customer } from '../types';

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
  const location = useLocation();
  const highlightInvoice = location.state?.highlightInvoice;
  
  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Load invoices
  useEffect(() => {
    loadInvoices();
  }, []);
  
  // Scroll to highlighted invoice
  useEffect(() => {
    if (highlightInvoice && invoices.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`invoice-${highlightInvoice}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.backgroundColor = '#ffeb3b';
          setTimeout(() => {
            element.style.backgroundColor = '';
          }, 2000);
        }
      }, 100);
    }
  }, [highlightInvoice, invoices]);

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
      
      // Load invoices and customers from Google Sheets
      const [invoicesData, customersData] = await Promise.all([
        googleSheetsService.getInvoices(),
        googleSheetsService.getCustomers()
      ]);
      setInvoices(invoicesData);
      setCustomers(customersData);
      
    } catch (err) {
      setError('Fehler beim Laden der Rechnungen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Selection functions
  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceId)) {
        return prev.filter(id => id !== invoiceId);
      } else {
        return [...prev, invoiceId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(i => i.id!).filter(id => id !== undefined));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedInvoices.length === 0) return;
    
    const confirmMessage = selectedInvoices.length === 1 
      ? 'Möchten Sie die ausgewählte Rechnung wirklich löschen?'
      : `Möchten Sie die ${selectedInvoices.length} ausgewählten Rechnungen wirklich löschen?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const invoiceId of selectedInvoices) {
          try {
            const success = await googleSheetsService.deleteInvoice(invoiceId);
            if (success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }
        
        // Update local state
        setInvoices(invoices.filter(i => !selectedInvoices.includes(i.id!)));
        setSelectedInvoices([]);
        
        if (errorCount === 0) {
          setSnackbar({ 
            open: true, 
            message: `${successCount} Rechnung${successCount > 1 ? 'en' : ''} erfolgreich gelöscht`, 
            severity: 'success' 
          });
        } else {
          setSnackbar({ 
            open: true, 
            message: `${successCount} gelöscht, ${errorCount} Fehler`, 
            severity: 'error' 
          });
        }
        
        if (successCount > 0) {
          setSelectMode(false);
        }
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        setSnackbar({ open: true, message: 'Fehler beim Löschen der Rechnungen', severity: 'error' });
      }
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (window.confirm('Rechnung wirklich löschen?')) {
      try {
        const success = await googleSheetsService.deleteInvoice(invoiceId);
        if (success) {
          setInvoices(invoices.filter(i => i.id !== invoiceId));
          setSnackbar({ open: true, message: 'Rechnung erfolgreich gelöscht', severity: 'success' });
        } else {
          setSnackbar({ open: true, message: 'Fehler beim Löschen der Rechnung', severity: 'error' });
        }
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        setSnackbar({ open: true, message: 'Fehler beim Löschen der Rechnung', severity: 'error' });
      }
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
        await googleSheetsService.updateInvoice(invoice.id!, { ...invoice, status: 'paid' });
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!selectMode ? (
              <Button
                variant="outlined"
                startIcon={<CheckBoxIcon />}
                onClick={() => {
                  setSelectMode(true);
                  setSelectedInvoices([]);
                }}
              >
                Auswählen
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectMode(false);
                    setSelectedInvoices([]);
                  }}
                >
                  Abbrechen
                </Button>
                <Button
                  variant="outlined"
                  startIcon={
                    selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0
                      ? <CheckBoxIcon />
                      : selectedInvoices.length > 0
                      ? <IndeterminateCheckBoxIcon />
                      : <CheckBoxOutlineBlankIcon />
                  }
                  onClick={handleSelectAll}
                >
                  {selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0
                    ? 'Alle abwählen'
                    : 'Alle auswählen'}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteSelected}
                  disabled={selectedInvoices.length === 0}
                >
                  {selectedInvoices.length > 0 
                    ? `${selectedInvoices.length} löschen`
                    : 'Löschen'}
                </Button>
              </>
            )}
          </Box>
        </Box>
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
                {selectMode && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedInvoices.length > 0 && selectedInvoices.length < filteredInvoices.length}
                      checked={filteredInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
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
                  <TableCell colSpan={selectMode ? 10 : 9} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={selectMode ? 10 : 9} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Keine Rechnungen gefunden
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow 
              key={invoice.id} 
              hover
              id={`invoice-${invoice.id}`}
              onClick={() => {
                if (selectMode && invoice.id) {
                  toggleInvoiceSelection(invoice.id);
                }
              }}
              selected={selectMode && selectedInvoices.includes(invoice.id!)}
              sx={{
                transition: 'background-color 0.3s',
                cursor: selectMode ? 'pointer' : 'default',
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
                    {selectMode && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedInvoices.includes(invoice.id!)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (invoice.id) {
                              toggleInvoiceSelection(invoice.id);
                            }
                          }}
                        />
                      </TableCell>
                    )}
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
                          onClick={async () => {
                            try {
                              const customer = customers.find(c => c.id === invoice.customerId);
                              if (!customer) {
                                alert('Kunde nicht gefunden');
                                return;
                              }
                              
                              const pdfBlob = await generateInvoicePDF(customer, invoice);
                              const url = URL.createObjectURL(pdfBlob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `Rechnung_${invoice.invoiceNumber}_${customer.name.replace(/\s+/g, '_')}.pdf`;
                              a.click();
                              URL.revokeObjectURL(url);
                            } catch (error) {
                              console.error('PDF Download Error:', error);
                              alert('Fehler beim PDF-Download');
                            }
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
                        
                        {!selectMode && (
                          <IconButton
                            size="small"
                            color="error"
                            title="Löschen"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (invoice.id) {
                                handleDeleteInvoice(invoice.id);
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
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

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default InvoicesList;