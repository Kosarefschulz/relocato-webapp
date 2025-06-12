import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Button,
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
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { CustomIcons } from './CustomIcons';
import Logo from './LogoIntegration';
import { googleSheetsPublicService as googleSheetsService } from '../services/googleSheetsPublic';
import DataTable from './DataTable';

interface Quote {
  id: string;
  customerId: string;
  customerName: string;
  price: number;
  comment: string;
  createdAt: Date;
  createdBy: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
}

const QuotesList: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load quotes
  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load quotes from Google Sheets
      const quotes = await googleSheetsService.getQuotes();
      setQuotes(quotes);
      
    } catch (err) {
      setError('Fehler beim Laden der Angebote');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Table columns configuration
  const columns = [
    {
      id: 'id',
      label: 'Angebots-ID',
      minWidth: 120,
      sortable: true,
      format: (value: string) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'customerName',
      label: 'Kunde',
      minWidth: 200,
      sortable: true,
      format: (value: string) => (
        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'price',
      label: 'Preis',
      align: 'right' as const,
      minWidth: 120,
      sortable: true,
      format: (value: number) => (
        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
          €{value?.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      sortable: true,
      filterable: true,
      filter: {
        type: 'select' as const,
        options: [
          { label: 'Entwurf', value: 'draft' },
          { label: 'Versendet', value: 'sent' },
          { label: 'Angenommen', value: 'accepted' },
          { label: 'Abgelehnt', value: 'rejected' },
        ],
      },
      format: (value: string) => {
        const getStatusColor = (status: string) => {
          switch (status) {
            case 'draft': return 'default';
            case 'sent': return 'primary';
            case 'accepted': return 'success';
            case 'rejected': return 'error';
            default: return 'default';
          }
        };
        
        const getStatusLabel = (status: string) => {
          switch (status) {
            case 'draft': return 'Entwurf';
            case 'sent': return 'Versendet';
            case 'accepted': return 'Angenommen';
            case 'rejected': return 'Abgelehnt';
            default: return status;
          }
        };
        
        return (
          <Chip
            icon={<CustomIcons.QuoteStatus status={value as any} sx={{ fontSize: 16 }} />}
            label={getStatusLabel(value)}
            color={getStatusColor(value) as any}
            size="small"
          />
        );
      },
    },
    {
      id: 'createdAt',
      label: 'Datum',
      minWidth: 120,
      sortable: true,
      format: (value: Date) => (
        <Typography variant="body2">
          {new Date(value).toLocaleDateString('de-DE')}
        </Typography>
      ),
    },
    {
      id: 'comment',
      label: 'Kommentar',
      minWidth: 200,
      sortable: false,
      format: (value: string) => (
        <Typography 
          variant="body2" 
          sx={{ 
            maxWidth: 200, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          title={value}
        >
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Aktionen',
      align: 'center' as const,
      minWidth: 200,
      sortable: false,
      filterable: false,
      format: (value: any, row: Quote) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <IconButton
            size="small"
            color="primary"
            title="Anzeigen"
            onClick={() => console.log('View quote:', row.id)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="default"
            title="Bearbeiten"
            onClick={() => console.log('Edit quote:', row.id)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="success"
            title="E-Mail senden"
            onClick={() => console.log('Send email for quote:', row.id)}
          >
            <EmailIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="info"
            title="PDF herunterladen"
            onClick={() => console.log('Download PDF for quote:', row.id)}
          >
            <GetAppIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            title="Löschen"
            onClick={() => {
              if (window.confirm('Angebot wirklich löschen?')) {
                console.log('Delete quote:', row.id);
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Statistics
  const totalQuotes = quotes.length;
  const totalValue = quotes.reduce((sum, quote) => sum + quote.price, 0);
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
  const acceptanceRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes * 100) : 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Logo variant="icon" size="large" />
          <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
            Sales Dashboard
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Angebotsverwaltung und Verkaufsanalyse
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
                    {totalQuotes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Angebote gesamt
                  </Typography>
                </Box>
                <CustomIcons.QuoteStatus status="accepted" color="primary" sx={{ fontSize: 40 }} />
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
                    €{totalValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gesamtwert
                  </Typography>
                </Box>
                <MonetizationOnIcon color="success" sx={{ fontSize: 40 }} />
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
                    {acceptedQuotes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Angenommen
                  </Typography>
                </Box>
                <TrendingUpIcon color="warning" sx={{ fontSize: 40 }} />
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
                    {acceptanceRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Erfolgsquote
                  </Typography>
                </Box>
                <TrendingUpIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={() => navigate('/search-customer')}
          sx={{ minWidth: 200 }}
        >
          Neues Angebot
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Advanced Data Table */}
      <DataTable
        title="Angebote verwalten"
        columns={columns}
        data={quotes}
        loading={loading}
        searchable={true}
        exportable={true}
        selectable={true}
        onRowClick={(quote) => console.log('Row clicked:', quote)}
        onExport={(data) => {
          console.log('Export data:', data);
          // Implement CSV/Excel export
        }}
        onSelectionChange={(selected) => {
          console.log('Selection changed:', selected);
        }}
        initialPageSize={25}
        stickyHeader={true}
      />

    </Container>
  );
};

export default QuotesList;