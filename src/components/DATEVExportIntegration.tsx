import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Sync as SyncIcon,
  Schedule as ScheduleIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  AccountBalance as BankIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FileCopy as FileCopyIcon,
  CloudDownload as CloudDownloadIcon,
  VerifiedUser as VerifiedIcon,
} from '@mui/icons-material';
import { format, addDays, addMonths, startOfMonth, endOfMonth, differenceInDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface DATEVRecord {
  id: string;
  recordType: 'invoice' | 'payment' | 'expense' | 'credit_note';
  invoiceId: string;
  invoiceNumber: string;
  date: Date;
  customerName: string;
  customerNumber: string;
  amount: number;
  netAmount: number;
  taxAmount: number;
  taxRate: number;
  accountNumber: string;
  contraAccount: string;
  description: string;
  reference: string;
  currency: string;
  exchangeRate: number;
  costCenter?: string;
  ustIdNr?: string;
  status: 'pending' | 'exported' | 'error' | 'verified';
  errorMessage?: string;
  exportDate?: Date;
  datevTransactionId?: string;
}

interface DATEVExportSettings {
  clientNumber: string;
  consultantNumber: string;
  fiscalYearStart: Date;
  fiscalYearEnd: Date;
  accountingType: 'er' | 'ea'; // Einnahmen-Überschuss-Rechnung oder Einnahmen-Ausgaben-Rechnung
  chartOfAccounts: 'skr03' | 'skr04';
  currency: string;
  defaultRevenueAccount: string;
  defaultTaxAccount: string;
  defaultCustomerAccount: string;
  autoExportEnabled: boolean;
  exportFrequency: 'daily' | 'weekly' | 'monthly';
  includePayments: boolean;
  includeExpenses: boolean;
  includeCreditNotes: boolean;
  exportFormat: 'ascii' | 'csv' | 'xml';
  validation: {
    validateUstIdNr: boolean;
    validateAccountNumbers: boolean;
    validateTaxRates: boolean;
    requireCostCenter: boolean;
  };
}

interface DATEVExportJob {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  recordsTotal: number;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsError: number;
  createdAt: Date;
  completedAt?: Date;
  exportFilePath?: string;
  errorLog?: string;
  settings: DATEVExportSettings;
}

interface AccountMapping {
  id: string;
  sourceAccount: string;
  sourceDescription: string;
  datevAccount: string;
  datevDescription: string;
  accountType: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity';
  isActive: boolean;
  validFrom: Date;
  validTo?: Date;
}

interface ValidationRule {
  id: string;
  field: string;
  rule: 'required' | 'numeric' | 'length' | 'format' | 'range';
  value: string;
  errorMessage: string;
  isActive: boolean;
}

interface DATEVExportIntegrationProps {
  onExportCompleted?: (job: DATEVExportJob) => void;
  onRecordValidated?: (record: DATEVRecord) => void;
  onError?: (error: string) => void;
}

const DATEVExportIntegration: React.FC<DATEVExportIntegrationProps> = ({
  onExportCompleted,
  onRecordValidated,
  onError,
}) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [records, setRecords] = useState<DATEVRecord[]>([]);
  const [exportJobs, setExportJobs] = useState<DATEVExportJob[]>([]);
  const [accountMappings, setAccountMappings] = useState<AccountMapping[]>([]);
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [selectedJob, setSelectedJob] = useState<DATEVExportJob | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<DATEVRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [exportSettings, setExportSettings] = useState<DATEVExportSettings>({
    clientNumber: '12345',
    consultantNumber: '67890',
    fiscalYearStart: new Date(new Date().getFullYear(), 0, 1),
    fiscalYearEnd: new Date(new Date().getFullYear(), 11, 31),
    accountingType: 'er',
    chartOfAccounts: 'skr03',
    currency: 'EUR',
    defaultRevenueAccount: '8400',
    defaultTaxAccount: '1776',
    defaultCustomerAccount: '10000',
    autoExportEnabled: false,
    exportFrequency: 'monthly',
    includePayments: true,
    includeExpenses: true,
    includeCreditNotes: true,
    exportFormat: 'ascii',
    validation: {
      validateUstIdNr: true,
      validateAccountNumbers: true,
      validateTaxRates: true,
      requireCostCenter: false,
    },
  });
  const [filterCriteria, setFilterCriteria] = useState({
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfMonth(new Date()),
    status: 'all',
    recordType: 'all',
    accountNumber: '',
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Initialize sample DATEV records
    const sampleRecords: DATEVRecord[] = [];
    for (let i = 0; i < 25; i++) {
      const date = addDays(startOfMonth(new Date()), Math.floor(Math.random() * 30));
      const netAmount = 500 + Math.random() * 2000;
      const taxRate = Math.random() > 0.7 ? 19 : 7; // Most invoices 19% VAT, some 7%
      const taxAmount = netAmount * (taxRate / 100);
      const amount = netAmount + taxAmount;

      const recordTypes: Array<DATEVRecord['recordType']> = ['invoice', 'payment', 'expense', 'credit_note'];
      const statuses: Array<DATEVRecord['status']> = ['pending', 'exported', 'error', 'verified'];

      sampleRecords.push({
        id: `datev-${i + 1}`,
        recordType: recordTypes[Math.floor(Math.random() * recordTypes.length)],
        invoiceId: `inv-${i + 1}`,
        invoiceNumber: `REC-${new Date().getFullYear()}-${(i + 1).toString().padStart(4, '0')}`,
        date,
        customerName: `Kunde ${i + 1} GmbH`,
        customerNumber: `10${(i + 1).toString().padStart(3, '0')}`,
        amount,
        netAmount,
        taxAmount,
        taxRate,
        accountNumber: '8400', // Standard revenue account
        contraAccount: '10000', // Customer receivables
        description: `Umzugsdienstleistung - Rechnung ${i + 1}`,
        reference: `REF-${i + 1}`,
        currency: 'EUR',
        exchangeRate: 1.0,
        costCenter: Math.random() > 0.5 ? `CC-${Math.floor(Math.random() * 10) + 1}` : undefined,
        ustIdNr: Math.random() > 0.3 ? `DE${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}` : undefined,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        errorMessage: Math.random() > 0.8 ? 'Fehlende USt-IdNr für innergemeinschaftliche Lieferung' : undefined,
        exportDate: Math.random() > 0.5 ? addDays(date, Math.floor(Math.random() * 10)) : undefined,
        datevTransactionId: Math.random() > 0.5 ? `DTX-${Math.floor(Math.random() * 1000000)}` : undefined,
      });
    }

    // Initialize sample export jobs
    const sampleJobs: DATEVExportJob[] = [
      {
        id: 'job-1',
        name: 'Monatsexport November 2024',
        description: 'Automatischer Export aller Rechnungen und Zahlungen für November 2024',
        startDate: new Date(2024, 10, 1),
        endDate: new Date(2024, 10, 30),
        status: 'completed',
        recordsTotal: 145,
        recordsProcessed: 145,
        recordsSuccess: 142,
        recordsError: 3,
        createdAt: new Date(2024, 11, 1, 10, 0),
        completedAt: new Date(2024, 11, 1, 10, 15),
        exportFilePath: '/exports/datev_2024_11.zip',
        settings: exportSettings,
      },
      {
        id: 'job-2',
        name: 'Quartalsexport Q3 2024',
        description: 'Quartalsweise Übertragung an DATEV für Q3 2024',
        startDate: new Date(2024, 6, 1),
        endDate: new Date(2024, 8, 30),
        status: 'failed',
        recordsTotal: 423,
        recordsProcessed: 298,
        recordsSuccess: 298,
        recordsError: 125,
        createdAt: new Date(2024, 9, 5, 14, 30),
        errorLog: 'Validierungsfehler: 125 Datensätze mit ungültigen Kontonummern',
        settings: exportSettings,
      },
      {
        id: 'job-3',
        name: 'Aktueller Export Dezember 2024',
        description: 'Laufender Export für den aktuellen Monat',
        startDate: new Date(2024, 11, 1),
        endDate: new Date(2024, 11, 31),
        status: 'running',
        recordsTotal: 89,
        recordsProcessed: 45,
        recordsSuccess: 43,
        recordsError: 2,
        createdAt: new Date(),
        settings: exportSettings,
      },
    ];

    // Initialize account mappings
    const sampleMappings: AccountMapping[] = [
      {
        id: 'mapping-1',
        sourceAccount: 'REVENUE_STANDARD',
        sourceDescription: 'Standard Umzugsdienstleistungen',
        datevAccount: '8400',
        datevDescription: 'Erlöse aus Dienstleistungen 19% USt',
        accountType: 'revenue',
        isActive: true,
        validFrom: new Date(2024, 0, 1),
      },
      {
        id: 'mapping-2',
        sourceAccount: 'REVENUE_REDUCED',
        sourceDescription: 'Ermäßigte Dienstleistungen',
        datevAccount: '8300',
        datevDescription: 'Erlöse aus Dienstleistungen 7% USt',
        accountType: 'revenue',
        isActive: true,
        validFrom: new Date(2024, 0, 1),
      },
      {
        id: 'mapping-3',
        sourceAccount: 'CUSTOMER_RECEIVABLES',
        sourceDescription: 'Kundenforderungen',
        datevAccount: '10000',
        datevDescription: 'Forderungen aus Lieferungen und Leistungen',
        accountType: 'asset',
        isActive: true,
        validFrom: new Date(2024, 0, 1),
      },
      {
        id: 'mapping-4',
        sourceAccount: 'VAT_19',
        sourceDescription: 'Umsatzsteuer 19%',
        datevAccount: '1776',
        datevDescription: 'Umsatzsteuer 19%',
        accountType: 'liability',
        isActive: true,
        validFrom: new Date(2024, 0, 1),
      },
      {
        id: 'mapping-5',
        sourceAccount: 'VAT_7',
        sourceDescription: 'Umsatzsteuer 7%',
        datevAccount: '1771',
        datevDescription: 'Umsatzsteuer 7%',
        accountType: 'liability',
        isActive: true,
        validFrom: new Date(2024, 0, 1),
      },
    ];

    // Initialize validation rules
    const sampleValidationRules: ValidationRule[] = [
      {
        id: 'rule-1',
        field: 'customerNumber',
        rule: 'required',
        value: '',
        errorMessage: 'Kundennummer ist ein Pflichtfeld',
        isActive: true,
      },
      {
        id: 'rule-2',
        field: 'accountNumber',
        rule: 'length',
        value: '4,6',
        errorMessage: 'Kontonummer muss zwischen 4 und 6 Zeichen lang sein',
        isActive: true,
      },
      {
        id: 'rule-3',
        field: 'amount',
        rule: 'numeric',
        value: '',
        errorMessage: 'Betrag muss eine gültige Zahl sein',
        isActive: true,
      },
      {
        id: 'rule-4',
        field: 'ustIdNr',
        rule: 'format',
        value: '^DE[0-9]{9}$',
        errorMessage: 'USt-IdNr muss dem Format DE123456789 entsprechen',
        isActive: true,
      },
      {
        id: 'rule-5',
        field: 'taxRate',
        rule: 'range',
        value: '0,25',
        errorMessage: 'Steuersatz muss zwischen 0% und 25% liegen',
        isActive: true,
      },
    ];

    setRecords(sampleRecords.sort((a, b) => b.date.getTime() - a.date.getTime()));
    setExportJobs(sampleJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    setAccountMappings(sampleMappings);
    setValidationRules(sampleValidationRules);
  };

  const validateRecords = async () => {
    setIsValidating(true);
    
    // Simulate validation process
    setTimeout(() => {
      const updatedRecords = records.map(record => {
        const errors: string[] = [];
        
        // Apply validation rules
        validationRules.forEach(rule => {
          if (!rule.isActive) return;
          
          const fieldValue = (record as any)[rule.field];
          
          switch (rule.rule) {
            case 'required':
              if (!fieldValue || fieldValue === '') {
                errors.push(rule.errorMessage);
              }
              break;
            case 'numeric':
              if (fieldValue && isNaN(Number(fieldValue))) {
                errors.push(rule.errorMessage);
              }
              break;
            case 'length':
              const [min, max] = rule.value.split(',').map(Number);
              if (fieldValue && (fieldValue.length < min || fieldValue.length > max)) {
                errors.push(rule.errorMessage);
              }
              break;
            case 'format':
              if (fieldValue && !new RegExp(rule.value).test(fieldValue)) {
                errors.push(rule.errorMessage);
              }
              break;
            case 'range':
              const [rangeMin, rangeMax] = rule.value.split(',').map(Number);
              if (fieldValue && (Number(fieldValue) < rangeMin || Number(fieldValue) > rangeMax)) {
                errors.push(rule.errorMessage);
              }
              break;
          }
        });
        
        return {
          ...record,
          status: errors.length > 0 ? 'error' as const : 'verified' as const,
          errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
        };
      });
      
      setRecords(updatedRecords);
      setIsValidating(false);
      
      const errorCount = updatedRecords.filter(r => r.status === 'error').length;
      if (errorCount > 0) {
        alert(`Validierung abgeschlossen. ${errorCount} Datensätze enthalten Fehler.`);
      } else {
        alert('Alle Datensätze erfolgreich validiert!');
      }
    }, 2000);
  };

  const exportToDATEV = async () => {
    setIsExporting(true);
    
    const validRecords = records.filter(r => r.status === 'verified' || r.status === 'pending');
    
    if (validRecords.length === 0) {
      alert('Keine gültigen Datensätze für Export gefunden. Bitte führen Sie zuerst eine Validierung durch.');
      setIsExporting(false);
      return;
    }
    
    // Create new export job
    const newJob: DATEVExportJob = {
      id: `job-${Date.now()}`,
      name: `Export ${format(new Date(), 'dd.MM.yyyy HH:mm')}`,
      description: `Manueller Export von ${validRecords.length} Datensätzen`,
      startDate: filterCriteria.dateFrom,
      endDate: filterCriteria.dateTo,
      status: 'running',
      recordsTotal: validRecords.length,
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsError: 0,
      createdAt: new Date(),
      settings: exportSettings,
    };
    
    setExportJobs(prev => [newJob, ...prev]);
    setSelectedJob(newJob);
    setIsJobDialogOpen(true);
    
    // Simulate export process
    setTimeout(() => {
      const successCount = Math.floor(validRecords.length * 0.95); // 95% success rate
      const errorCount = validRecords.length - successCount;
      
      const completedJob: DATEVExportJob = {
        ...newJob,
        status: 'completed',
        recordsProcessed: validRecords.length,
        recordsSuccess: successCount,
        recordsError: errorCount,
        completedAt: new Date(),
        exportFilePath: `/exports/datev_${format(new Date(), 'yyyy_MM_dd_HHmm')}.zip`,
      };
      
      setExportJobs(prev => prev.map(job => job.id === newJob.id ? completedJob : job));
      setSelectedJob(completedJob);
      
      // Update record statuses
      const updatedRecords = records.map((record, index) => {
        if (validRecords.includes(record)) {
          const isSuccess = index < successCount;
          return {
            ...record,
            status: isSuccess ? 'exported' as const : 'error' as const,
            exportDate: isSuccess ? new Date() : undefined,
            datevTransactionId: isSuccess ? `DTX-${Math.floor(Math.random() * 1000000)}` : undefined,
            errorMessage: !isSuccess ? 'Export fehlgeschlagen - Netzwerkfehler' : undefined,
          };
        }
        return record;
      });
      
      setRecords(updatedRecords);
      setIsExporting(false);
      
      onExportCompleted?.(completedJob);
      alert(`Export abgeschlossen! ${successCount} Datensätze erfolgreich exportiert, ${errorCount} Fehler.`);
    }, 5000);
  };

  const getStatusColor = (status: DATEVRecord['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'exported': return 'success';
      case 'error': return 'error';
      case 'verified': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: DATEVRecord['status']) => {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'exported': return 'Exportiert';
      case 'error': return 'Fehler';
      case 'verified': return 'Validiert';
      default: return status;
    }
  };

  const getJobStatusColor = (status: DATEVExportJob['status']) => {
    switch (status) {
      case 'pending': return theme.palette.info.main;
      case 'running': return theme.palette.warning.main;
      case 'completed': return theme.palette.success.main;
      case 'failed': return theme.palette.error.main;
      case 'cancelled': return theme.palette.grey[500];
      default: return theme.palette.grey[500];
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const dateMatch = record.date >= filterCriteria.dateFrom && record.date <= filterCriteria.dateTo;
      const statusMatch = filterCriteria.status === 'all' || record.status === filterCriteria.status;
      const typeMatch = filterCriteria.recordType === 'all' || record.recordType === filterCriteria.recordType;
      const accountMatch = !filterCriteria.accountNumber || record.accountNumber.includes(filterCriteria.accountNumber);
      
      return dateMatch && statusMatch && typeMatch && accountMatch;
    });
  }, [records, filterCriteria]);

  const renderRecordsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          DATEV-Datensätze
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            onClick={validateRecords}
            disabled={isValidating}
          >
            {isValidating ? 'Validiere...' : 'Validieren'}
          </Button>
          
          <Button
            variant="contained"
            startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
            onClick={exportToDATEV}
            disabled={isExporting || records.filter(r => r.status === 'verified' || r.status === 'pending').length === 0}
          >
            {isExporting ? 'Exportiere...' : 'Nach DATEV exportieren'}
          </Button>
        </Box>
      </Box>
      
      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Von Datum"
              type="date"
              value={format(filterCriteria.dateFrom, 'yyyy-MM-dd')}
              onChange={(e) => setFilterCriteria(prev => ({ ...prev, dateFrom: parseISO(e.target.value) }))}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Bis Datum"
              type="date"
              value={format(filterCriteria.dateTo, 'yyyy-MM-dd')}
              onChange={(e) => setFilterCriteria(prev => ({ ...prev, dateTo: parseISO(e.target.value) }))}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterCriteria.status}
                onChange={(e) => setFilterCriteria(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="pending">Ausstehend</MenuItem>
                <MenuItem value="verified">Validiert</MenuItem>
                <MenuItem value="exported">Exportiert</MenuItem>
                <MenuItem value="error">Fehler</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Typ</InputLabel>
              <Select
                value={filterCriteria.recordType}
                onChange={(e) => setFilterCriteria(prev => ({ ...prev, recordType: e.target.value }))}
              >
                <MenuItem value="all">Alle</MenuItem>
                <MenuItem value="invoice">Rechnung</MenuItem>
                <MenuItem value="payment">Zahlung</MenuItem>
                <MenuItem value="expense">Ausgabe</MenuItem>
                <MenuItem value="credit_note">Gutschrift</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Konto"
              value={filterCriteria.accountNumber}
              onChange={(e) => setFilterCriteria(prev => ({ ...prev, accountNumber: e.target.value }))}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => setFilterCriteria({
                dateFrom: startOfMonth(new Date()),
                dateTo: endOfMonth(new Date()),
                status: 'all',
                recordType: 'all',
                accountNumber: '',
              })}
              size="small"
            >
              Zurücksetzen
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Beleg</TableCell>
              <TableCell>Datum</TableCell>
              <TableCell>Kunde</TableCell>
              <TableCell align="right">Netto</TableCell>
              <TableCell align="right">USt</TableCell>
              <TableCell align="right">Brutto</TableCell>
              <TableCell>Konto</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>DATEV-ID</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRecords.slice(0, 15).map((record) => (
              <TableRow key={record.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {record.invoiceNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {record.recordType.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {format(record.date, 'dd.MM.yyyy', { locale: de })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {record.customerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {record.customerNumber}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    €{record.netAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    €{record.taxAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({record.taxRate}%)
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    €{record.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {record.accountNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(record.status)}
                    size="small"
                    color={getStatusColor(record.status)}
                  />
                  {record.errorMessage && (
                    <Tooltip title={record.errorMessage}>
                      <ErrorIcon sx={{ fontSize: 16, color: 'error.main', ml: 0.5 }} />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {record.datevTransactionId || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsRecordDialogOpen(true);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Bearbeiten">
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderExportJobsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Export-Aufträge
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={exportToDATEV}
          disabled={isExporting}
        >
          Neuer Export
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {exportJobs.map((job, index) => (
          <Grid item xs={12} key={job.id}>
            <AnimatedCard delay={index * 100}>
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${getJobStatusColor(job.status)} 0%, ${alpha(getJobStatusColor(job.status), 0.8)} 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <SyncIcon sx={{ fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {job.name}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {job.description}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {format(job.startDate, 'dd.MM.yyyy', { locale: de })} - {format(job.endDate, 'dd.MM.yyyy', { locale: de })}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {job.status === 'running' ? 
                          `${Math.round((job.recordsProcessed / job.recordsTotal) * 100)}%` :
                          job.status.toUpperCase()
                        }
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {job.recordsProcessed} / {job.recordsTotal}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {job.status === 'running' && (
                    <LinearProgress
                      variant="determinate"
                      value={(job.recordsProcessed / job.recordsTotal) * 100}
                      sx={{
                        mb: 2,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: alpha('#fff', 0.8),
                        },
                        backgroundColor: alpha('#fff', 0.2),
                      }}
                    />
                  )}
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {job.recordsSuccess}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Erfolgreich
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {job.recordsError}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Fehler
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {format(job.createdAt, 'HH:mm', { locale: de })}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Gestartet
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {job.completedAt ? format(job.completedAt, 'HH:mm', { locale: de }) : '-'}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Beendet
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedJob(job);
                        setIsJobDialogOpen(true);
                      }}
                      sx={{
                        color: 'white',
                        borderColor: alpha('#fff', 0.5),
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: alpha('#fff', 0.1),
                        },
                      }}
                    >
                      Details
                    </Button>
                    
                    {job.exportFilePath && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CloudDownloadIcon />}
                        sx={{
                          color: 'white',
                          borderColor: alpha('#fff', 0.5),
                          '&:hover': {
                            borderColor: 'white',
                            backgroundColor: alpha('#fff', 0.1),
                          },
                        }}
                      >
                        Download
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Box>
            </AnimatedCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderAccountMappingTab = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Kontenzuordnung
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          Neue Zuordnung
        </Button>
      </Box>
      
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Quellkonto</TableCell>
              <TableCell>DATEV-Konto</TableCell>
              <TableCell>Typ</TableCell>
              <TableCell>Gültig ab</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accountMappings.map((mapping) => (
              <TableRow key={mapping.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {mapping.sourceAccount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mapping.sourceDescription}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {mapping.datevAccount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mapping.datevDescription}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={mapping.accountType.replace('_', ' ').toUpperCase()}
                    size="small"
                    color={
                      mapping.accountType === 'revenue' ? 'success' :
                      mapping.accountType === 'expense' ? 'error' :
                      mapping.accountType === 'asset' ? 'info' :
                      mapping.accountType === 'liability' ? 'warning' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {format(mapping.validFrom, 'dd.MM.yyyy', { locale: de })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={mapping.isActive ? 'Aktiv' : 'Inaktiv'}
                    size="small"
                    color={mapping.isActive ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Bearbeiten">
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Löschen">
                      <IconButton size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderAnalyticsTab = () => {
    const statusData = [
      { name: 'Ausstehend', value: records.filter(r => r.status === 'pending').length, color: theme.palette.warning.main },
      { name: 'Validiert', value: records.filter(r => r.status === 'verified').length, color: theme.palette.info.main },
      { name: 'Exportiert', value: records.filter(r => r.status === 'exported').length, color: theme.palette.success.main },
      { name: 'Fehler', value: records.filter(r => r.status === 'error').length, color: theme.palette.error.main },
    ];

    const monthlyData = records.reduce((acc, record) => {
      const month = format(record.date, 'MMM yyyy', { locale: de });
      const existing = acc.find(item => item.month === month);
      
      if (existing) {
        existing.exported += record.status === 'exported' ? 1 : 0;
        existing.errors += record.status === 'error' ? 1 : 0;
        existing.amount += record.status === 'exported' ? record.amount : 0;
      } else {
        acc.push({
          month,
          exported: record.status === 'exported' ? 1 : 0,
          errors: record.status === 'error' ? 1 : 0,
          amount: record.status === 'exported' ? record.amount : 0,
        });
      }
      
      return acc;
    }, [] as Array<{ month: string; exported: number; errors: number; amount: number }>);

    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Export-Analytics
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ReceiptIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {records.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Gesamt Datensätze
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {records.filter(r => r.status === 'exported').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Exportiert
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {records.filter(r => r.status === 'error').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fehler
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={1}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EuroIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      €{records.filter(r => r.status === 'exported').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Exportierter Wert
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Monatliche Export-Statistik
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="exported" fill={theme.palette.success.main} name="Exportiert" />
                    <Bar dataKey="errors" fill={theme.palette.error.main} name="Fehler" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Status-Verteilung
              </Typography>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" />
              DATEV Export Integration
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={exportSettings.autoExportEnabled}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, autoExportEnabled: e.target.checked }))}
                  />
                }
                label="Auto-Export"
              />
              
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setIsSettingsDialogOpen(true)}
              >
                Einstellungen
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Automatische DATEV-Integration für Rechnungswesen und Steuerberatung mit vollständiger Konformität
          </Typography>
        </Paper>
      </SlideInContainer>

      {/* Navigation Tabs */}
      <SlideInContainer delay={200}>
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
          >
            <Tab label="Datensätze" icon={<ReceiptIcon />} />
            <Tab label="Export-Aufträge" icon={<SyncIcon />} />
            <Tab label="Kontenzuordnung" icon={<BankIcon />} />
            <Tab label="Analytics" icon={<AssessmentIcon />} />
          </Tabs>
        </Paper>
      </SlideInContainer>

      {/* Tab Content */}
      <SlideInContainer delay={400}>
        {selectedTab === 0 && renderRecordsTab()}
        {selectedTab === 1 && renderExportJobsTab()}
        {selectedTab === 2 && renderAccountMappingTab()}
        {selectedTab === 3 && renderAnalyticsTab()}
      </SlideInContainer>
    </Box>
  );
};

export default DATEVExportIntegration;