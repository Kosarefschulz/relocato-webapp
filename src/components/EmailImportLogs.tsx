import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert, Tabs, Tab, Badge } from '@mui/material';
import Grid from './GridCompat';
import {
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { collection, query, orderBy, limit, getDocs, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface FailedImport {
  id: string;
  from: string;
  subject: string;
  date: Date;
  reason: string;
  text?: string;
  fullText?: string;
  fullHtml?: string;
  extractedData?: any;
  error?: string;
  timestamp: Date;
  folder?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`import-tabpanel-${index}`}
      aria-labelledby={`import-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const EmailImportLogs: React.FC = () => {
  const [failedImports, setFailedImports] = useState<FailedImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImport, setSelectedImport] = useState<FailedImport | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    noName: 0,
    parseError: 0,
    other: 0
  });

  // Load failed imports
  useEffect(() => {
    loadFailedImports();
  }, []);

  const loadFailedImports = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'failed_imports'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      const imports: FailedImport[] = [];
      const newStats = { total: 0, noName: 0, parseError: 0, other: 0 };
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const failedImport = {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          timestamp: data.timestamp?.toDate() || new Date()
        } as FailedImport;
        
        imports.push(failedImport);
        
        // Update stats
        newStats.total++;
        if (data.reason?.includes('No customer name') || data.reason?.includes('Kein Name')) {
          newStats.noName++;
        } else if (data.reason?.includes('Parse error')) {
          newStats.parseError++;
        } else {
          newStats.other++;
        }
      });
      
      setFailedImports(imports);
      setStats(newStats);
    } catch (error) {
      console.error('Error loading failed imports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter imports based on tab
  const getFilteredImports = () => {
    let filtered = failedImports;
    
    // Apply tab filter
    switch (tabValue) {
      case 1: // No Name
        filtered = filtered.filter(imp => 
          imp.reason?.includes('No customer name') || imp.reason?.includes('Kein Name')
        );
        break;
      case 2: // Parse Errors
        filtered = filtered.filter(imp => imp.reason?.includes('Parse error'));
        break;
      case 3: // Other
        filtered = filtered.filter(imp => 
          !imp.reason?.includes('No customer name') && 
          !imp.reason?.includes('Kein Name') &&
          !imp.reason?.includes('Parse error')
        );
        break;
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(imp =>
        imp.from?.toLowerCase().includes(search) ||
        imp.subject?.toLowerCase().includes(search) ||
        imp.reason?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  };

  // View details
  const handleViewDetails = (failedImport: FailedImport) => {
    setSelectedImport(failedImport);
    setDetailsDialog(true);
  };

  // Delete failed import
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'failed_imports', id));
      await loadFailedImports();
    } catch (error) {
      console.error('Error deleting failed import:', error);
    }
  };

  const filteredImports = getFilteredImports();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Import-Fehlerprotokoll
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Hier werden E-Mails angezeigt, die nicht automatisch importiert werden konnten. 
        Sie können die Details überprüfen und ggf. manuell nachbearbeiten.
      </Alert>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Suche nach Absender, Betreff oder Fehlergrund..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab 
            label={
              <Badge badgeContent={stats.total} color="primary">
                <Box sx={{ pr: 2 }}>Alle</Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats.noName} color="warning">
                <Box sx={{ pr: 2 }}>Kein Name</Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats.parseError} color="error">
                <Box sx={{ pr: 2 }}>Parse-Fehler</Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats.other} color="default">
                <Box sx={{ pr: 2 }}>Sonstige</Box>
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Datum</TableCell>
              <TableCell>Absender</TableCell>
              <TableCell>Betreff</TableCell>
              <TableCell>Fehlergrund</TableCell>
              <TableCell>Ordner</TableCell>
              <TableCell align="center">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Lade Daten...
                </TableCell>
              </TableRow>
            ) : filteredImports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Keine fehlgeschlagenen Imports gefunden
                </TableCell>
              </TableRow>
            ) : (
              filteredImports.map((imp) => (
                <TableRow key={imp.id}>
                  <TableCell>
                    {format(imp.date, 'dd.MM.yyyy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {imp.from}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {imp.subject}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={imp.reason}
                      size="small"
                      color={
                        imp.reason?.includes('No customer name') || imp.reason?.includes('Kein Name')
                          ? 'warning'
                          : imp.reason?.includes('Parse error')
                          ? 'error'
                          : 'default'
                      }
                      icon={
                        imp.reason?.includes('No customer name') || imp.reason?.includes('Kein Name')
                          ? <WarningIcon />
                          : imp.reason?.includes('Parse error')
                          ? <ErrorIcon />
                          : undefined
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {imp.folder || 'INBOX'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(imp)}
                      title="Details anzeigen"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import-Details</DialogTitle>
        <DialogContent>
          {selectedImport && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Basis-Informationen
              </Typography>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Absender
                    </Typography>
                    <Typography variant="body2">
                      {selectedImport.from}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Empfangen
                    </Typography>
                    <Typography variant="body2">
                      {format(selectedImport.date, 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Betreff
                    </Typography>
                    <Typography variant="body2">
                      {selectedImport.subject}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Fehlergrund
                    </Typography>
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {selectedImport.reason}
                    </Alert>
                  </Grid>
                </Grid>
              </Box>

              {selectedImport.extractedData && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Extrahierte Daten
                  </Typography>
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem', overflow: 'auto' }}>
                      {JSON.stringify(selectedImport.extractedData, null, 2)}
                    </pre>
                  </Box>
                </>
              )}

              {(selectedImport.fullText || selectedImport.text) && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    E-Mail-Text
                  </Typography>
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="body2" component="pre" sx={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: '0.875rem'
                    }}>
                      {selectedImport.fullText || selectedImport.text}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Schließen</Button>
          {selectedImport && (
            <Button
              color="error"
              onClick={() => {
                handleDelete(selectedImport.id);
                setDetailsDialog(false);
              }}
            >
              Löschen
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailImportLogs;