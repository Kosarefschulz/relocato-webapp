import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tooltip,
  LinearProgress,
  Menu,
  Divider,
  Badge,
} from '@mui/material';
import Grid from './GridCompat';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { customerFilesService, CustomerFile } from '../services/customerFilesService';

interface CustomerFileManagerProps {
  customerId: string;
}

const CustomerFileManager: React.FC<CustomerFileManagerProps> = ({ customerId }) => {
  const [files, setFiles] = useState<CustomerFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [selectedFile, setSelectedFile] = useState<CustomerFile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [stats, setStats] = useState<any>(null);

  const [editForm, setEditForm] = useState({
    category: 'allgemein' as CustomerFile['category'],
    description: '',
    tags: [] as string[],
  });

  // Lade Dateien
  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customerFilesService.getCustomerFiles(customerId);
      setFiles(data);

      const fileStats = await customerFilesService.getFileStats(customerId);
      setStats(fileStats);
    } catch (error) {
      console.error('❌ Error loading files:', error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadFiles();
    // Initialisiere Storage Bucket
    customerFilesService.initializeBucket();
  }, [loadFiles]);

  // Drag & Drop Handler
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);

      for (const file of acceptedFiles) {
        // Validiere Datei
        const validation = customerFilesService.validateFile(file);
        if (!validation.valid) {
          alert(`${file.name}: ${validation.error}`);
          continue;
        }

        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        try {
          // Automatische Kategorisierung basierend auf Dateiname
          let category: CustomerFile['category'] = 'allgemein';
          const lowerName = file.name.toLowerCase();
          if (lowerName.includes('angebot')) category = 'angebot';
          else if (lowerName.includes('rechnung') || lowerName.includes('invoice'))
            category = 'rechnung';
          else if (lowerName.includes('vertrag') || lowerName.includes('contract'))
            category = 'vertrag';
          else if (lowerName.includes('foto') || lowerName.includes('bild'))
            category = 'besichtigung';

          setUploadProgress((prev) => ({ ...prev, [file.name]: 50 }));

          const result = await customerFilesService.uploadFile(customerId, file, category);

          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

          if (result.success) {
            console.log('✅ File uploaded:', file.name);
            loadFiles();
          } else {
            console.error('❌ Upload failed:', result.error);
            alert(`Upload fehlgeschlagen: ${result.error}`);
          }
        } catch (error: any) {
          console.error('❌ Error uploading file:', error);
          alert(`Fehler beim Upload: ${error.message}`);
        }

        // Entferne Progress nach kurzer Zeit
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newProg = { ...prev };
            delete newProg[file.name];
            return newProg;
          });
        }, 2000);
      }

      setUploading(false);
    },
    [customerId, loadFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: true,
  });

  const handleDownload = async (file: CustomerFile) => {
    try {
      const url = await customerFilesService.getDownloadUrl(file.file_path);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      alert('Fehler beim Herunterladen');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm('Datei wirklich löschen?')) return;

    try {
      const success = await customerFilesService.deleteFile(fileId);
      if (success) {
        loadFiles();
      }
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      alert('Fehler beim Löschen');
    }
  };

  const handleReparse = async (fileId: string) => {
    try {
      const success = await customerFilesService.reparseFile(fileId);
      if (success) {
        alert('PDF wird neu geparst...');
        setTimeout(loadFiles, 2000);
      }
    } catch (error) {
      console.error('❌ Error reparsing file:', error);
      alert('Fehler beim Neu-Parsen');
    }
  };

  const handleEdit = (file: CustomerFile) => {
    setSelectedFile(file);
    setEditForm({
      category: file.category,
      description: file.description || '',
      tags: file.tags || [],
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedFile) return;

    try {
      const success = await customerFilesService.updateFile(selectedFile.id, editForm);
      if (success) {
        setEditDialogOpen(false);
        loadFiles();
      }
    } catch (error) {
      console.error('❌ Error updating file:', error);
      alert('Fehler beim Speichern');
    }
  };

  const getFileIcon = (file: CustomerFile) => {
    if (file.file_type === 'pdf') return <PdfIcon color="error" />;
    if (['png', 'jpg', 'jpeg'].includes(file.file_type))
      return <ImageIcon color="primary" />;
    return <DocIcon color="action" />;
  };

  const getParseStatusIcon = (file: CustomerFile) => {
    if (file.file_type !== 'pdf') return null;

    switch (file.parse_status) {
      case 'completed':
        return <CheckIcon color="success" fontSize="small" />;
      case 'failed':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'processing':
      case 'pending':
        return <PendingIcon color="warning" fontSize="small" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'angebot':
        return 'primary';
      case 'rechnung':
        return 'success';
      case 'vertrag':
        return 'warning';
      case 'besichtigung':
        return 'info';
      default:
        return 'default';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      angebot: 'Angebot',
      rechnung: 'Rechnung',
      vertrag: 'Vertrag',
      besichtigung: 'Besichtigung',
      sonstiges: 'Sonstiges',
      allgemein: 'Allgemein',
    };
    return labels[category] || category;
  };

  return (
    <Box>
      {/* Header mit Statistiken */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FolderIcon sx={{ mr: 1, opacity: 0.6 }} />
                  <Box>
                    <Typography variant="h5">{stats.total}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Dateien
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PdfIcon sx={{ mr: 1, opacity: 0.6 }} />
                  <Box>
                    <Typography variant="h5">{stats.parsedPdfs}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Geparste PDFs
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FileIcon sx={{ mr: 1, opacity: 0.6 }} />
                  <Box>
                    <Typography variant="h5">{stats.byCategory.rechnung || 0}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Rechnungen
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Gesamtgröße
                </Typography>
                <Typography variant="h6">
                  {customerFilesService.formatFileSize(stats.totalSize)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          mb: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Dateien hier ablegen...' : 'Dateien hochladen'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Ziehe Dateien hierher oder klicke zum Auswählen
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          Unterstützt: PDF, Bilder, Word, Excel (max. 50MB)
        </Typography>
        {uploading && <CircularProgress sx={{ mt: 2 }} />}
      </Paper>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Box sx={{ mb: 3 }}>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <Box key={fileName} sx={{ mb: 1 }}>
              <Typography variant="body2">{fileName}</Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          ))}
        </Box>
      )}

      {/* Dateiliste */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : files.length === 0 ? (
        <Alert severity="info">Noch keine Dateien hochgeladen</Alert>
      ) : (
        <Paper>
          <List>
            {files.map((file, index) => (
              <React.Fragment key={file.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemIcon>
                    <Badge
                      badgeContent={getParseStatusIcon(file)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                      {getFileIcon(file)}
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{file.file_name}</Typography>
                        <Chip
                          label={getCategoryLabel(file.category)}
                          size="small"
                          color={getCategoryColor(file.category) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          {customerFilesService.formatFileSize(file.file_size)} •{' '}
                          {new Date(file.uploaded_at).toLocaleDateString('de-DE')}
                        </Typography>
                        {file.description && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {file.description}
                          </Typography>
                        )}
                        {file.is_parsed && file.parsed_data?.grossAmount && (
                          <Chip
                            label={`${file.parsed_data.grossAmount.toFixed(2)} €`}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Herunterladen">
                      <IconButton onClick={() => handleDownload(file)}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    {file.file_type === 'pdf' && file.parse_status === 'failed' && (
                      <Tooltip title="Neu parsen">
                        <IconButton onClick={() => handleReparse(file.id)}>
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Löschen">
                      <IconButton onClick={() => handleDelete(file.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Datei bearbeiten</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Kategorie</InputLabel>
                <Select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value as any })
                  }
                >
                  <MenuItem value="angebot">Angebot</MenuItem>
                  <MenuItem value="rechnung">Rechnung</MenuItem>
                  <MenuItem value="vertrag">Vertrag</MenuItem>
                  <MenuItem value="besichtigung">Besichtigung</MenuItem>
                  <MenuItem value="sonstiges">Sonstiges</MenuItem>
                  <MenuItem value="allgemein">Allgemein</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Beschreibung"
                multiline
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerFileManager;
