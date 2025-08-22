'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Button
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

interface LineItem {
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface QuoteDetail {
  id: string;
  quoteNumber: string;
  date: string;
  expirationDate: string;
  status: 'offen' | 'angenommen' | 'abgelehnt' | 'entwurf';
  lineItems: LineItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string;
}

interface QuoteDetailCardProps {
  quote: QuoteDetail;
  customerName: string;
}

export const QuoteDetailCard: React.FC<QuoteDetailCardProps> = ({ quote, customerName }) => {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'angenommen':
        return 'success';
      case 'offen':
        return 'warning';
      case 'abgelehnt':
        return 'error';
      case 'entwurf':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'angenommen':
        return <CheckCircleIcon />;
      case 'offen':
        return <ScheduleIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  return (
    <Card sx={{
      background: 'rgba(221, 226, 198, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(187, 197, 170, 0.4)',
      borderRadius: 3,
    }}>
      <CardContent sx={{ p: 0 }}>
        
        {/* Angebots-Header */}
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid rgba(187, 197, 170, 0.3)',
          background: 'linear-gradient(135deg, rgba(167, 38, 8, 0.05) 0%, rgba(187, 197, 170, 0.1) 100%)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#090c02', mb: 1 }}>
                Angebot {quote.quoteNumber}
              </Typography>
              <Typography variant="body1" sx={{ color: '#090c02', mb: 1 }}>
                für {customerName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon fontSize="small" sx={{ color: '#a72608' }} />
                  <Typography variant="body2" sx={{ color: '#090c02' }}>
                    {new Date(quote.date).toLocaleDateString('de-DE')}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#bbc5aa' }}>
                  gültig bis {new Date(quote.expirationDate).toLocaleDateString('de-DE')}
                </Typography>
              </Box>
            </Box>
            
            <Chip
              icon={getStatusIcon(quote.status)}
              label={quote.status.toUpperCase()}
              color={getStatusColor(quote.status) as any}
              sx={{ fontWeight: 700 }}
            />
          </Box>
        </Box>

        {/* Positions-Tabelle wie Lexoffice */}
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(187, 197, 170, 0.2)' }}>
                <TableCell sx={{ fontWeight: 700, color: '#090c02', width: 60 }}>Pos.</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#090c02' }}>Bezeichnung</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#090c02', textAlign: 'center', width: 100 }}>Menge</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#090c02', textAlign: 'right', width: 120 }}>Einzelpreis</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#090c02', textAlign: 'right', width: 120 }}>Gesamtpreis</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quote.lineItems.map((item, index) => (
                <TableRow 
                  key={index}
                  sx={{ 
                    backgroundColor: index % 2 === 0 ? 'rgba(230, 238, 214, 0.3)' : 'rgba(221, 226, 198, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(167, 38, 8, 0.05)',
                    }
                  }}
                >
                  <TableCell sx={{ color: '#090c02', fontWeight: 600 }}>
                    {item.position}
                  </TableCell>
                  <TableCell sx={{ color: '#090c02' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {item.description}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: '#090c02', textAlign: 'center' }}>
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell sx={{ color: '#090c02', textAlign: 'right', fontFamily: 'monospace' }}>
                    €{item.unitPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell sx={{ color: '#090c02', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                    €{item.totalPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summen-Bereich wie Lexoffice */}
        <Box sx={{ p: 3, borderTop: '1px solid rgba(187, 197, 170, 0.3)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ minWidth: 300 }}>
              
              {/* Zwischensumme */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ color: '#090c02' }}>
                  Zwischensumme (netto):
                </Typography>
                <Typography variant="body1" sx={{ color: '#090c02', fontFamily: 'monospace', fontWeight: 600 }}>
                  €{quote.subtotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              
              {/* MwSt */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1" sx={{ color: '#090c02' }}>
                  MwSt (19%):
                </Typography>
                <Typography variant="body1" sx={{ color: '#090c02', fontFamily: 'monospace', fontWeight: 600 }}>
                  €{quote.vatAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2, borderColor: '#a72608' }} />
              
              {/* Gesamtsumme */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#a72608', fontWeight: 800 }}>
                  Gesamtsumme (brutto):
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: '#a72608', 
                  fontFamily: 'monospace', 
                  fontWeight: 800,
                  fontSize: '1.5rem'
                }}>
                  €{quote.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              
              <Typography variant="caption" sx={{ color: '#bbc5aa', fontStyle: 'italic' }}>
                Alle Preise inkl. 19% MwSt.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Angebots-Notizen */}
        {quote.notes && (
          <Box sx={{ 
            p: 3, 
            borderTop: '1px solid rgba(187, 197, 170, 0.3)',
            backgroundColor: 'rgba(230, 238, 214, 0.3)'
          }}>
            <Typography variant="subtitle2" sx={{ color: '#a72608', fontWeight: 600, mb: 1 }}>
              Anmerkungen:
            </Typography>
            <Typography variant="body2" sx={{ color: '#090c02', fontStyle: 'italic' }}>
              {quote.notes}
            </Typography>
          </Box>
        )}

        {/* Angebots-Aktionen */}
        <Box sx={{ 
          p: 3, 
          borderTop: '1px solid rgba(187, 197, 170, 0.3)',
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end'
        }}>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            sx={{
              borderColor: '#bbc5aa',
              color: '#090c02',
              '&:hover': {
                borderColor: '#a72608',
                backgroundColor: 'rgba(167, 38, 8, 0.1)',
              }
            }}
          >
            PDF erstellen
          </Button>
          <Button
            variant="contained"
            startIcon={<EuroIcon />}
            sx={{
              background: 'linear-gradient(135deg, #a72608 0%, #bbc5aa 100%)',
              color: '#e6eed6',
              '&:hover': {
                transform: 'scale(1.05)',
              }
            }}
          >
            Rechnung erstellen
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};