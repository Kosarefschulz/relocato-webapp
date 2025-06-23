import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Stack,
  Tooltip,
  Divider,
  Badge
} from '@mui/material';
import Grid from './GridCompat';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  AccountBalance as BankIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ContentPaste as PasteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { 
  invoiceRecognitionService, 
  RecognitionRule, 
  EmailInvoice 
} from '../services/invoiceRecognitionService';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

const InvoiceEmailImportConfig: React.FC = () => {
  const [rules, setRules] = useState<RecognitionRule[]>([]);
  const [editDialog, setEditDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<RecognitionRule | null>(null);
  const [unprocessedInvoices, setUnprocessedInvoices] = useState<EmailInvoice[]>([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    processed: 0,
    unprocessed: 0,
    byAccount: {
      steinpfleger: 0,
      wertvoll: 0,
      unknown: 0
    }
  });
  const [testEmail, setTestEmail] = useState({
    from: '',
    subject: '',
    hasAttachment: false
  });
  const [testResult, setTestResult] = useState<string>('');

  // Form state for rule editing
  const [formData, setFormData] = useState({
    name: '',
    type: 'sender' as 'sender' | 'subject' | 'attachment',
    pattern: '',
    targetAccount: 'wertvoll' as 'steinpfleger' | 'wertvoll',
    priority: 5,
    active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load rules
    const loadedRules = await invoiceRecognitionService.getRules();
    setRules(loadedRules);

    // Load unprocessed invoices
    const invoices = await invoiceRecognitionService.getUnprocessedInvoices();
    setUnprocessedInvoices(invoices);

    // Load statistics
    const stats = await invoiceRecognitionService.getStatistics();
    setStatistics(stats);
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      type: 'sender',
      pattern: '',
      targetAccount: 'wertvoll',
      priority: 5,
      active: true
    });
    setEditDialog(true);
  };

  const handleEditRule = (rule: RecognitionRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      pattern: rule.pattern,
      targetAccount: rule.targetAccount,
      priority: rule.priority,
      active: rule.active
    });
    setEditDialog(true);
  };

  const handleSaveRule = () => {
    if (editingRule) {
      // Update existing rule
      invoiceRecognitionService.updateRule(editingRule.id, formData);
    } else {
      // Add new rule
      invoiceRecognitionService.addRule(formData);
    }
    
    setEditDialog(false);
    loadData();
  };

  const handleDeleteRule = (id: string) => {
    if (window.confirm('Möchten Sie diese Regel wirklich löschen?')) {
      invoiceRecognitionService.deleteRule(id);
      loadData();
    }
  };

  const handleTestEmail = () => {
    const testEmailData = {
      from: testEmail.from,
      subject: testEmail.subject,
      attachments: testEmail.hasAttachment ? [
        { filename: 'rechnung.pdf', contentType: 'application/pdf', size: 1024 }
      ] : []
    };

    const result = invoiceRecognitionService['recognizeCompany'](testEmailData);
    setTestResult(result);
  };

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'sender': return 'Absender';
      case 'subject': return 'Betreff';
      case 'attachment': return 'Anhang';
      default: return type;
    }
  };

  const getAccountColor = (account: string) => {
    return account === 'steinpfleger' ? 'primary' : 'secondary';
  };

  return (
    <Box>
      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Gesamt
                  </Typography>
                  <Typography variant="h4">
                    {statistics.total}
                  </Typography>
                </Box>
                <EmailIcon color="action" />
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Verarbeitet
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {statistics.processed}
                  </Typography>
                </Box>
                <CheckIcon color="success" />
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Steinpfleger
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {statistics.byAccount.steinpfleger}
                  </Typography>
                </Box>
                <BankIcon color="primary" />
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Wertvoll
                  </Typography>
                  <Typography variant="h4" color="secondary">
                    {statistics.byAccount.wertvoll}
                  </Typography>
                </Box>
                <BankIcon color="secondary" />
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Recognition Rules */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Erkennungsregeln
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddRule}
            >
              Neue Regel
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Typ</TableCell>
                  <TableCell>Muster</TableCell>
                  <TableCell>Zielkonto</TableCell>
                  <TableCell align="center">Priorität</TableCell>
                  <TableCell align="center">Aktiv</TableCell>
                  <TableCell align="center">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getRuleTypeLabel(rule.type)} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {rule.pattern}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={rule.targetAccount === 'steinpfleger' ? 'Steinpfleger' : 'Wertvoll'} 
                        size="small" 
                        color={getAccountColor(rule.targetAccount)}
                      />
                    </TableCell>
                    <TableCell align="center">{rule.priority}</TableCell>
                    <TableCell align="center">
                      <Switch 
                        checked={rule.active} 
                        size="small"
                        onChange={(e) => {
                          invoiceRecognitionService.updateRule(rule.id, { active: e.target.checked });
                          loadData();
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditRule(rule)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteRule(rule.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Test Email Recognition */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Erkennung testen
          </Typography>
          
          <Stack spacing={2}>
            <TextField
              label="Absender E-Mail"
              value={testEmail.from}
              onChange={(e) => setTestEmail({ ...testEmail, from: e.target.value })}
              placeholder="rechnung@lieferant.de"
              fullWidth
            />
            
            <TextField
              label="Betreff"
              value={testEmail.subject}
              onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
              placeholder="Rechnung Nr. 12345 - Materiallieferung"
              fullWidth
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={testEmail.hasAttachment}
                  onChange={(e) => setTestEmail({ ...testEmail, hasAttachment: e.target.checked })}
                />
              }
              label="PDF-Anhang vorhanden"
            />
            
            <Button
              variant="outlined"
              onClick={handleTestEmail}
              disabled={!testEmail.from && !testEmail.subject}
            >
              Erkennung testen
            </Button>
            
            {testResult && (
              <Alert 
                severity={testResult === 'unknown' ? 'warning' : 'success'}
                onClose={() => setTestResult('')}
              >
                Erkanntes Konto: <strong>{
                  testResult === 'steinpfleger' ? 'Steinpfleger' :
                  testResult === 'wertvoll' ? 'Wertvoll' :
                  'Unbekannt'
                }</strong>
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Rule Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRule ? 'Regel bearbeiten' : 'Neue Regel erstellen'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            
            <FormControl fullWidth>
              <InputLabel>Typ</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                label="Typ"
              >
                <MenuItem value="sender">Absender</MenuItem>
                <MenuItem value="subject">Betreff</MenuItem>
                <MenuItem value="attachment">Anhang</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Muster (Regex)"
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              fullWidth
              required
              helperText="Regulärer Ausdruck für die Erkennung"
            />
            
            <FormControl fullWidth>
              <InputLabel>Zielkonto</InputLabel>
              <Select
                value={formData.targetAccount}
                onChange={(e) => setFormData({ ...formData, targetAccount: e.target.value as any })}
                label="Zielkonto"
              >
                <MenuItem value="steinpfleger">Steinpfleger</MenuItem>
                <MenuItem value="wertvoll">Wertvoll</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Priorität"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Niedrigere Werte haben höhere Priorität"
              InputProps={{ inputProps: { min: 1, max: 100 } }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              }
              label="Regel aktiv"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Abbrechen
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveRule}
            disabled={!formData.name || !formData.pattern}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceEmailImportConfig;