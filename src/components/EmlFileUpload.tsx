import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Customer } from '../types';
import { databaseService } from '../config/database.config';
import { parseEmail } from '../utils/emailParser';

interface EmlFile {
  name: string;
  content: string;
  parsed?: ParsedEmail;
  status: 'pending' | 'parsed' | 'error' | 'imported';
  error?: string;
  customer?: Partial<Customer>;
}

interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  date: string;
  text?: string;
  html?: string;
  headers: Record<string, string>;
}

const EmlFileUpload: React.FC = () => {
  const [files, setFiles] = useState<EmlFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<EmlFile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [importStats, setImportStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    duplicates: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const parseEmlFile = async (content: string): Promise<ParsedEmail> => {
    const lines = content.split('\n');
    const headers: Record<string, string> = {};
    let headerEnd = 0;
    
    // Parse headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') {
        headerEnd = i;
        break;
      }
      
      if (line.startsWith(' ') || line.startsWith('\t')) {
        // Continuation of previous header
        const lastKey = Object.keys(headers).pop();
        if (lastKey) {
          headers[lastKey] += ' ' + line.trim();
        }
      } else {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          headers[key.toLowerCase()] = value;
        }
      }
    }
    
    // Extract body
    const bodyLines = lines.slice(headerEnd + 1);
    let text = '';
    let html = '';
    let inHtml = false;
    
    for (const line of bodyLines) {
      if (line.includes('<html') || line.includes('<HTML')) {
        inHtml = true;
      }
      
      if (inHtml) {
        html += line + '\n';
      } else {
        text += line + '\n';
      }
      
      if (line.includes('</html>') || line.includes('</HTML>')) {
        inHtml = false;
      }
    }
    
    // Clean up text - remove quoted-printable encoding
    text = text.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    return {
      from: headers['from'] || '',
      to: headers['to'] || '',
      subject: headers['subject'] || '',
      date: headers['date'] || new Date().toISOString(),
      text: text.trim(),
      html: html.trim(),
      headers,
    };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: EmlFile[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.name.endsWith('.eml')) {
        const content = await file.text();
        newFiles.push({
          name: file.name,
          content,
          status: 'pending',
        });
      }
    }
    
    setFiles([...files, ...newFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = async () => {
    setProcessing(true);
    const updatedFiles = [...files];
    
    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status === 'pending') {
        try {
          // Parse EML file
          const parsed = await parseEmlFile(updatedFiles[i].content);
          updatedFiles[i].parsed = parsed;
          
          // Extract customer data
          const emailData = {
            from: parsed.from,
            subject: parsed.subject,
            text: parsed.text,
            html: parsed.html,
          };
          
          const parsedCustomer = parseEmail(emailData);
          
          // Create customer object
          const customer: Partial<Customer> = {
            name: parsedCustomer.name || 'Unbekannt',
            email: parsedCustomer.email || '',
            phone: parsedCustomer.phone || '',
            fromAddress: parsedCustomer.fromAddress || '',
            toAddress: parsedCustomer.toAddress || '',
            movingDate: parsedCustomer.movingDate || '',
            apartment: {
              rooms: parsedCustomer.apartment?.rooms || 0,
              area: parsedCustomer.apartment?.area || 0,
              floor: parsedCustomer.apartment?.floor || 0,
              hasElevator: parsedCustomer.apartment?.hasElevator || false,
            },
            services: ['Umzug'],
            notes: parsedCustomer.notes || `Importiert aus E-Mail: ${parsed.subject}`,
            source: parsedCustomer.source || 'EML Import',
            tags: ['EML Import'],
          };
          
          updatedFiles[i].customer = customer;
          updatedFiles[i].status = 'parsed';
        } catch (error) {
          updatedFiles[i].status = 'error';
          updatedFiles[i].error = error.message;
        }
      }
    }
    
    setFiles(updatedFiles);
    setProcessing(false);
  };

  const handleEditCustomer = (file: EmlFile) => {
    if (!file.customer) return;
    setSelectedFile(file);
    setEditingCustomer({ ...file.customer });
    setEditDialogOpen(true);
  };

  const handleSaveCustomer = () => {
    if (!selectedFile || !editingCustomer) return;
    
    const updatedFiles = files.map(f => {
      if (f.name === selectedFile.name) {
        return {
          ...f,
          customer: editingCustomer,
        };
      }
      return f;
    });
    
    setFiles(updatedFiles);
    setEditDialogOpen(false);
    setSelectedFile(null);
    setEditingCustomer(null);
  };

  const handleImportCustomer = async (file: EmlFile) => {
    if (!file.customer) return;
    
    try {
      // Check for duplicates
      const existingCustomers = await databaseService.getCustomers();
      const duplicate = existingCustomers.find(c => 
        (c.email && c.email === file.customer!.email) ||
        (c.phone && c.phone === file.customer!.phone)
      );
      
      if (duplicate) {
        if (!window.confirm(`Ein Kunde mit dieser E-Mail/Telefonnummer existiert bereits (${duplicate.name}). Trotzdem importieren?`)) {
          return;
        }
      }
      
      // Generate ID
      const customerId = `K${Date.now()}`;
      
      // Create customer
      const newCustomer: Customer = {
        id: customerId,
        ...file.customer as Customer,
        createdAt: new Date(),
      };
      
      await databaseService.addCustomer(newCustomer);
      
      // Update file status
      const updatedFiles = files.map(f => {
        if (f.name === file.name) {
          return {
            ...f,
            status: 'imported' as const,
          };
        }
        return f;
      });
      
      setFiles(updatedFiles);
      
      // Update stats
      setImportStats(prev => ({
        ...prev,
        successful: prev.successful + 1,
      }));
      
    } catch (error) {
      console.error('Error importing customer:', error);
      alert('Fehler beim Importieren: ' + error.message);
    }
  };

  const handleImportAll = async () => {
    const parsedFiles = files.filter(f => f.status === 'parsed' && f.customer);
    if (parsedFiles.length === 0) {
      alert('Keine Dateien zum Importieren verfügbar');
      return;
    }
    
    if (!window.confirm(`Möchten Sie ${parsedFiles.length} Kunden importieren?`)) {
      return;
    }
    
    setProcessing(true);
    const stats = {
      total: parsedFiles.length,
      successful: 0,
      failed: 0,
      duplicates: 0,
    };
    
    for (const file of parsedFiles) {
      try {
        await handleImportCustomer(file);
        stats.successful++;
      } catch (error) {
        stats.failed++;
      }
    }
    
    setImportStats(stats);
    setProcessing(false);
    
    alert(`Import abgeschlossen:\n✅ Erfolgreich: ${stats.successful}\n❌ Fehlgeschlagen: ${stats.failed}`);
  };

  const handleRemoveFile = (fileName: string) => {
    setFiles(files.filter(f => f.name !== fileName));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'parsed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'imported':
        return <CheckCircleIcon color="primary" />;
      default:
        return <EmailIcon color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'parsed':
        return 'success';
      case 'error':
        return 'error';
      case 'imported':
        return 'primary';
      default:
        return 'default';
    }
  };

  const pendingFiles = files.filter(f => f.status === 'pending').length;
  const parsedFiles = files.filter(f => f.status === 'parsed').length;
  const importedFiles = files.filter(f => f.status === 'imported').length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        EML Datei Import
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Laden Sie .eml Dateien hoch, um automatisch Kundendaten zu extrahieren und zu importieren.
        Die Dateien werden analysiert und Sie können die Daten vor dem Import bearbeiten.
      </Alert>

      {/* Upload Area */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          border: '2px dashed',
          borderColor: 'divider',
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".eml"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          EML Dateien hier ablegen oder klicken zum Auswählen
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unterstützt werden .eml Dateien (mehrere Dateien möglich)
        </Typography>
      </Paper>

      {/* Stats */}
      {files.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Gesamt
                </Typography>
                <Typography variant="h4">
                  {files.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Ausstehend
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {pendingFiles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Bereit
                </Typography>
                <Typography variant="h4" color="success.main">
                  {parsedFiles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Importiert
                </Typography>
                <Typography variant="h4" color="primary">
                  {importedFiles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Action Buttons */}
      {files.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={processFiles}
            disabled={processing || pendingFiles === 0}
            startIcon={processing ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {processing ? 'Verarbeite...' : `${pendingFiles} Dateien verarbeiten`}
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleImportAll}
            disabled={processing || parsedFiles === 0}
            startIcon={<SaveIcon />}
          >
            Alle importieren ({parsedFiles})
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setFiles([])}
            disabled={processing}
          >
            Alle entfernen
          </Button>
        </Box>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <List>
            {files.map((file, index) => (
              <React.Fragment key={file.name}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemIcon>
                    {getStatusIcon(file.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{file.name}</Typography>
                        <Chip
                          label={file.status}
                          size="small"
                          color={getStatusColor(file.status) as any}
                        />
                      </Box>
                    }
                    secondary={
                      file.customer && (
                        <Box sx={{ mt: 1 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon fontSize="small" />
                                <Typography variant="body2">
                                  {file.customer.name || 'Kein Name'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmailIcon fontSize="small" />
                                <Typography variant="body2">
                                  {file.customer.email || 'Keine E-Mail'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneIcon fontSize="small" />
                                <Typography variant="body2">
                                  {file.customer.phone || 'Kein Telefon'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarIcon fontSize="small" />
                                <Typography variant="body2">
                                  {file.customer.movingDate || 'Kein Datum'}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      )
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {file.status === 'parsed' && (
                      <>
                        <Tooltip title="Bearbeiten">
                          <IconButton onClick={() => handleEditCustomer(file)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Importieren">
                          <IconButton
                            color="primary"
                            onClick={() => handleImportCustomer(file)}
                          >
                            <SaveIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title="Entfernen">
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveFile(file.name)}
                        disabled={file.status === 'imported'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Kundendaten bearbeiten
        </DialogTitle>
        <DialogContent>
          {editingCustomer && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={editingCustomer.name || ''}
                  onChange={(e) => setEditingCustomer({
                    ...editingCustomer,
                    name: e.target.value,
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="E-Mail"
                  value={editingCustomer.email || ''}
                  onChange={(e) => setEditingCustomer({
                    ...editingCustomer,
                    email: e.target.value,
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefon"
                  value={editingCustomer.phone || ''}
                  onChange={(e) => setEditingCustomer({
                    ...editingCustomer,
                    phone: e.target.value,
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Von Adresse"
                  value={editingCustomer.fromAddress || ''}
                  onChange={(e) => setEditingCustomer({
                    ...editingCustomer,
                    fromAddress: e.target.value,
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nach Adresse"
                  value={editingCustomer.toAddress || ''}
                  onChange={(e) => setEditingCustomer({
                    ...editingCustomer,
                    toAddress: e.target.value,
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Umzugsdatum"
                  type="date"
                  value={editingCustomer.movingDate || ''}
                  onChange={(e) => setEditingCustomer({
                    ...editingCustomer,
                    movingDate: e.target.value,
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Zimmer"
                  type="number"
                  value={editingCustomer.apartment?.rooms || 0}
                  onChange={(e) => setEditingCustomer({
                    ...editingCustomer,
                    apartment: {
                      ...editingCustomer.apartment!,
                      rooms: parseInt(e.target.value) || 0,
                    },
                  })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Fläche (m²)"
                  type="number"
                  value={editingCustomer.apartment?.area || 0}
                  onChange={(e) => setEditingCustomer({
                    ...editingCustomer,
                    apartment: {
                      ...editingCustomer.apartment!,
                      area: parseInt(e.target.value) || 0,
                    },
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notizen"
                  value={editingCustomer.notes || ''}
                  onChange={(e) => setEditingCustomer({
                    ...editingCustomer,
                    notes: e.target.value,
                  })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSaveCustomer} variant="contained" color="primary">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmlFileUpload;