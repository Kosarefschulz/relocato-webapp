import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  SmartToy as AIIcon,
  Save as SaveIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { intelligentAssistant } from '../services/ai/intelligentAssistantService';
import { supabaseService } from '../services/supabaseService';
import { Customer, Quote } from '../types';
import { motion } from 'framer-motion';

interface AdditionalService {
  name: string;
  cost: number;
  description?: string;
}

interface PostMoveCalculation {
  customerId: string;
  customerName: string;
  originalQuoteId?: string;
  originalCost: number;
  additionalServices: AdditionalService[];
  actualHours?: number;
  actualWorkers?: number;
  hourlyRate: number;
  notes: string;
  totalAdditionalCost: number;
  finalTotalCost: number;
  aiExplanation?: string;
}

export const PostMoveCalculator: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const [calculation, setCalculation] = useState<PostMoveCalculation>({
    customerId: '',
    customerName: '',
    originalCost: 0,
    additionalServices: [],
    hourlyRate: 50,
    notes: '',
    totalAdditionalCost: 0,
    finalTotalCost: 0
  });

  const [newService, setNewService] = useState<AdditionalService>({
    name: '',
    cost: 0,
    description: ''
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      const customerQuotes = quotes.filter(q => q.customerId === selectedCustomer.id);
      if (customerQuotes.length > 0) {
        setSelectedQuote(customerQuotes[0]);
        setCalculation(prev => ({
          ...prev,
          customerId: selectedCustomer.id!,
          customerName: selectedCustomer.name || '',
          originalQuoteId: customerQuotes[0].id,
          originalCost: customerQuotes[0].price || 0
        }));
      }
    }
  }, [selectedCustomer, quotes]);

  useEffect(() => {
    calculateTotals();
  }, [calculation.additionalServices, calculation.actualHours, calculation.actualWorkers, calculation.hourlyRate, calculation.originalCost]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersData, quotesData] = await Promise.all([
        supabaseService.getCustomers(),
        supabaseService.getQuotes()
      ]);
      setCustomers(customersData);
      setQuotes(quotesData);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let additionalCost = 0;

    // Zusätzliche Services
    calculation.additionalServices.forEach(service => {
      additionalCost += service.cost;
    });

    // Zusätzliche Stunden
    if (calculation.actualHours && calculation.actualWorkers) {
      const extraHours = calculation.actualHours;
      const extraHoursCost = extraHours * calculation.actualWorkers * calculation.hourlyRate;
      additionalCost += extraHoursCost;
    }

    const finalTotal = calculation.originalCost + additionalCost;

    setCalculation(prev => ({
      ...prev,
      totalAdditionalCost: additionalCost,
      finalTotalCost: finalTotal
    }));
  };

  const handleAddService = () => {
    if (!newService.name || newService.cost <= 0) return;

    setCalculation(prev => ({
      ...prev,
      additionalServices: [...prev.additionalServices, { ...newService }]
    }));

    setNewService({ name: '', cost: 0, description: '' });
    setDialogOpen(false);
  };

  const handleRemoveService = (index: number) => {
    setCalculation(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.filter((_, i) => i !== index)
    }));
  };

  const handleAIAnalysis = async () => {
    if (!selectedCustomer || !selectedQuote) {
      alert('Bitte wähle zuerst einen Kunden und ein Angebot aus.');
      return;
    }

    setAiAnalyzing(true);

    try {
      const result = await intelligentAssistant.calculatePostMoveCosts({
        originalQuote: selectedQuote,
        actualHours: calculation.actualHours,
        actualWorkers: calculation.actualWorkers,
        additionalServices: calculation.additionalServices.map(s => s.name),
        notes: calculation.notes
      });

      setCalculation(prev => ({
        ...prev,
        aiExplanation: result.explanation
      }));

      alert('✅ KI-Analyse abgeschlossen! Siehe Erklärung unten.');
    } catch (error) {
      console.error('KI-Analyse Fehler:', error);
      alert('❌ Fehler bei der KI-Analyse');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSave = async () => {
    // TODO: Speichern in Supabase
    console.log('Nachberechnung speichern:', calculation);
    alert('✅ Nachberechnung gespeichert!');
  };

  const handleGeneratePDF = () => {
    // TODO: PDF generieren
    console.log('PDF generieren für:', calculation);
    alert('📄 PDF wird generiert...');
  };

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mb: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CalculateIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                💰 Nachberechnung
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Erstelle präzise Nachberechnungen mit KI-Unterstützung
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Linke Spalte: Eingaben */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
              <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
                📋 Auftragsdetails
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(option) => option.name || ''}
                    value={selectedCustomer}
                    onChange={(_, newValue) => setSelectedCustomer(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Kunde auswählen"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
                      />
                    )}
                  />
                </Grid>

                {selectedCustomer && (
                  <Grid item xs={12}>
                    <Autocomplete
                      options={quotes.filter(q => q.customerId === selectedCustomer.id)}
                      getOptionLabel={(option) => `Angebot vom ${new Date(option.createdAt).toLocaleDateString('de-DE')} - ${option.price}€`}
                      value={selectedQuote}
                      onChange={(_, newValue) => {
                        setSelectedQuote(newValue);
                        if (newValue) {
                          setCalculation(prev => ({
                            ...prev,
                            originalQuoteId: newValue.id,
                            originalCost: newValue.price || 0
                          }));
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Original-Angebot"
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
                            },
                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                          }}
                        />
                      )}
                    />
                  </Grid>
                )}

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tatsächliche Stunden"
                    value={calculation.actualHours || ''}
                    onChange={(e) => setCalculation(prev => ({
                      ...prev,
                      actualHours: parseFloat(e.target.value) || undefined
                    }))}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Anzahl Mitarbeiter"
                    value={calculation.actualWorkers || ''}
                    onChange={(e) => setCalculation(prev => ({
                      ...prev,
                      actualWorkers: parseInt(e.target.value) || undefined
                    }))}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Stundensatz (€)"
                    value={calculation.hourlyRate}
                    onChange={(e) => setCalculation(prev => ({
                      ...prev,
                      hourlyRate: parseFloat(e.target.value) || 50
                    }))}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ color: 'white' }}>
                      Zusatzleistungen
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      variant="contained"
                      onClick={() => setDialogOpen(true)}
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        color: 'white'
                      }}
                    >
                      Hinzufügen
                    </Button>
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Leistung</TableCell>
                          <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Preis</TableCell>
                          <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Aktion</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {calculation.additionalServices.map((service, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ color: 'white' }}>{service.name}</TableCell>
                            <TableCell align="right" sx={{ color: 'white' }}>{service.cost.toFixed(2)} €</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveService(index)}
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notizen"
                    value={calculation.notes}
                    onChange={(e) => setCalculation(prev => ({ ...prev, notes: e.target.value }))}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={aiAnalyzing ? <CircularProgress size={20} /> : <AIIcon />}
                    onClick={handleAIAnalysis}
                    disabled={aiAnalyzing || !selectedCustomer || !selectedQuote}
                    sx={{
                      background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                      color: 'white',
                      py: 1.5
                    }}
                  >
                    {aiAnalyzing ? 'KI analysiert...' : '🤖 KI-Analyse durchführen'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Rechte Spalte: Zusammenfassung */}
          <Grid item xs={12} md={5}>
            <Paper
              sx={{
                p: 3,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(99, 102, 241, 0.3)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
                💰 Kostenübersicht
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Original-Angebot:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                    {calculation.originalCost.toFixed(2)} €
                  </Typography>
                </Box>

                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Zusatzkosten:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
                    + {calculation.totalAdditionalCost.toFixed(2)} €
                  </Typography>
                </Box>

                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Gesamt:
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 700 }}>
                    {calculation.finalTotalCost.toFixed(2)} €
                  </Typography>
                </Box>
              </Box>

              {calculation.aiExplanation && (
                <Alert
                  icon={<AIIcon />}
                  severity="info"
                  sx={{
                    mb: 2,
                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                    color: 'white',
                    '& .MuiAlert-icon': { color: 'primary.main' }
                  }}
                >
                  <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap' }}>
                    {calculation.aiExplanation}
                  </Typography>
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    sx={{
                      bgcolor: 'success.main',
                      '&:hover': { bgcolor: 'success.dark' }
                    }}
                  >
                    Speichern
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PdfIcon />}
                    onClick={handleGeneratePDF}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    PDF
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      {/* Dialog für neue Zusatzleistung */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Zusatzleistung hinzufügen</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Leistung"
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Kosten (€)"
                value={newService.cost || ''}
                onChange={(e) => setNewService(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Beschreibung (optional)"
                value={newService.description || ''}
                onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' }
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'white' }}>
            Abbrechen
          </Button>
          <Button
            onClick={handleAddService}
            variant="contained"
            disabled={!newService.name || newService.cost <= 0}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
            }}
          >
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PostMoveCalculator;
