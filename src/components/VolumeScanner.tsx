import React, { useState, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  Fab,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemAvatar,
  Avatar,
  Divider,
  LinearProgress
} from '@mui/material';
import Grid from './GridCompat';
import {
  CameraAlt as CameraIcon,
  Upload as UploadIcon,
  Add as AddIcon,
  ArrowBack as BackIcon,
  Save as SaveIcon,
  CheckCircle as CheckIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Chair as FurnitureIcon,
  Home as RoomIcon,
  ThreeDRotation as ARIcon,
  Straighten as RulerIcon,
  PhotoLibrary as PhotoIcon,
  NavigateNext as NextIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FurnitureType, 
  RoomType, 
  ScannedItem, 
  FURNITURE_DIMENSIONS,
  calculateVolume
} from '../types/volumeScanner';
import { Customer } from '../types';
import { volumeScannerService } from '../services/volumeScannerService';
import { supabase } from '../config/supabase';

const VolumeScanner: React.FC = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Customer data
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  // Session data
  const [sessionId] = useState(`session_${Date.now()}`);
  const [currentRoom, setCurrentRoom] = useState<RoomType>('living_room');
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  
  // Current item being scanned
  const [scanMode, setScanMode] = useState<'photo' | 'manual'>('photo');
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [furnitureType, setFurnitureType] = useState<FurnitureType>('sofa');
  const [customName, setCustomName] = useState('');
  const [dimensions, setDimensions] = useState({ length: 0, width: 0, height: 0 });
  const [isFragile, setIsFragile] = useState(false);
  const [requiresDisassembly, setRequiresDisassembly] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // UI state
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<ScannedItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = ['Raum auswählen', 'Möbel scannen', 'Überprüfung'];

  // Load customer data
  React.useEffect(() => {
    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (error) throw error;
      setCustomer(data);
    } catch (err) {
      console.error('Error loading customer:', err);
      setError('Kunde konnte nicht geladen werden');
    }
  };

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedPhotos(prev => [...prev, ...files]);
    
    // If photo mode and first photo, try AI detection
    if (scanMode === 'photo' && files.length > 0 && !editingItem) {
      setLoading(true);
      try {
        const detection = await volumeScannerService.detectFurnitureFromImage(files[0]);
        
        if (detection.type && detection.type !== 'other') {
          setFurnitureType(detection.type as FurnitureType);
          
          // Use suggested dimensions if available
          if (detection.suggestedDimensions) {
            setDimensions(detection.suggestedDimensions);
          } else {
            // Use standard dimensions for detected type
            const furniture = FURNITURE_DIMENSIONS[detection.type as FurnitureType];
            if (furniture) {
              setDimensions(furniture.averageDimensions);
              setCustomName(furniture.name);
            }
          }
          
          // Show confidence to user
          if (detection.confidence > 0.8) {
            setError(null);
          } else if (detection.confidence > 0.6) {
            setError('AI-Erkennung: Bitte überprüfen Sie den Möbeltyp und die Maße');
          } else {
            setError('AI-Erkennung unsicher: Bitte wählen Sie den Möbeltyp manuell');
          }
        }
      } catch (err) {
        console.error('AI detection failed:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickSelect = (type: FurnitureType, subtype?: string) => {
    setFurnitureType(type);
    const furniture = FURNITURE_DIMENSIONS[type];
    
    if (subtype && furniture.variations) {
      const variation = furniture.variations.find(v => v.subtype === subtype);
      if (variation) {
        setDimensions(variation.dimensions);
        setCustomName(`${furniture.name} (${subtype})`);
      }
    } else {
      setDimensions(furniture.averageDimensions);
      setCustomName(furniture.name);
    }
    
    setShowItemDialog(true);
  };

  const handleSaveItem = async () => {
    try {
      setLoading(true);
      
      // Calculate volume
      const volumeM3 = calculateVolume(dimensions);
      
      // Create item
      const newItem: ScannedItem = {
        id: `item_${Date.now()}`,
        customerId: customerId!,
        sessionId,
        itemType: furnitureType,
        customName: customName || FURNITURE_DIMENSIONS[furnitureType].name,
        roomName: currentRoom,
        dimensions,
        volumeM3,
        scanMethod: scanMode,
        confidence: scanMode === 'manual' ? 1.0 : 0.8,
        photos: [], // Will be uploaded separately
        isFragile,
        requiresDisassembly,
        packingMaterials: [],
        specialInstructions,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Upload photos if any
      if (selectedPhotos.length > 0) {
        const photoUrls = await volumeScannerService.uploadPhotos(selectedPhotos, newItem.id);
        newItem.photos = photoUrls.map((url, index) => ({
          id: `photo_${Date.now()}_${index}`,
          url,
          timestamp: new Date()
        }));
      }

      // Save to state
      setScannedItems(prev => [...prev, newItem]);
      
      // Reset form
      setShowItemDialog(false);
      setSelectedPhotos([]);
      setCustomName('');
      setDimensions({ length: 0, width: 0, height: 0 });
      setIsFragile(false);
      setRequiresDisassembly(false);
      setSpecialInstructions('');
      
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Fehler beim Speichern des Gegenstands');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSession = async () => {
    try {
      setLoading(true);
      
      // Calculate total volume
      const totalVolume = scannedItems.reduce((sum, item) => sum + item.volumeM3, 0);
      
      // Save session
      await volumeScannerService.saveSession({
        id: sessionId,
        customerId: customerId!,
        startTime: new Date(),
        endTime: new Date(),
        totalVolumeM3: totalVolume,
        itemCount: scannedItems.length,
        scanQualityScore: 0.9
      });

      // Save all items
      for (const item of scannedItems) {
        await volumeScannerService.saveScannedItem(item);
      }

      // Navigate to results or back to customer
      navigate(`/customer-details/${customerId}`, {
        state: { scanComplete: true, totalVolume }
      });
      
    } catch (err) {
      console.error('Error finishing session:', err);
      setError('Fehler beim Speichern der Scan-Session');
    } finally {
      setLoading(false);
    }
  };

  const getTotalVolume = () => {
    return scannedItems.reduce((sum, item) => sum + item.volumeM3, 0);
  };

  const getItemsByRoom = () => {
    const rooms: Record<string, ScannedItem[]> = {};
    scannedItems.forEach(item => {
      if (!rooms[item.roomName]) {
        rooms[item.roomName] = [];
      }
      rooms[item.roomName].push(item);
    });
    return rooms;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(`/customer-details/${customerId}`)} sx={{ mb: 2 }}>
          <BackIcon />
        </IconButton>
        
        <Typography variant="h4" gutterBottom>
          Volumen-Scanner
        </Typography>
        
        {customer && (
          <Typography variant="body1" color="text.secondary">
            Kunde: {customer.name} • {customer.fromAddress}
          </Typography>
        )}
      </Box>

      {/* Progress */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Content */}
      {activeStep === 0 && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Welchen Raum möchten Sie scannen?
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {[
              { type: 'living_room', label: 'Wohnzimmer' },
              { type: 'bedroom', label: 'Schlafzimmer' },
              { type: 'kitchen', label: 'Küche' },
              { type: 'bathroom', label: 'Badezimmer' },
              { type: 'office', label: 'Büro' },
              { type: 'dining_room', label: 'Esszimmer' },
              { type: 'basement', label: 'Keller' },
              { type: 'attic', label: 'Dachboden' },
              { type: 'garage', label: 'Garage' },
              { type: 'other', label: 'Sonstiges' }
            ].map(room => (
              <Grid item xs={6} sm={4} md={3} key={room.type}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: currentRoom === room.type ? 2 : 0,
                    borderColor: 'primary.main',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                  onClick={() => {
                    setCurrentRoom(room.type as RoomType);
                    setActiveStep(1);
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <RoomIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="subtitle1">
                      {room.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {activeStep === 1 && (
        <>
          {/* Quick Add Buttons */}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Schnellauswahl häufiger Möbel
            </Typography>
            
            <Grid container spacing={2}>
              {Object.entries(FURNITURE_DIMENSIONS).map(([type, furniture]) => (
                <Grid item xs={6} sm={4} md={3} key={type}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FurnitureIcon />}
                    onClick={() => handleQuickSelect(type as FurnitureType)}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    {furniture.name}
                  </Button>
                </Grid>
              ))}
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<CameraIcon />}
                onClick={() => {
                  setScanMode('photo');
                  setShowItemDialog(true);
                }}
              >
                Foto-Scan
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<RulerIcon />}
                onClick={() => {
                  setScanMode('manual');
                  setShowItemDialog(true);
                }}
              >
                Manuelle Eingabe
              </Button>
            </Box>
          </Paper>

          {/* Scanned Items */}
          {scannedItems.filter(item => item.roomName === currentRoom).length > 0 && (
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Gescannte Gegenstände in diesem Raum
              </Typography>
              
              <List>
                {scannedItems
                  .filter(item => item.roomName === currentRoom)
                  .map((item, index) => (
                    <React.Fragment key={item.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <FurnitureIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={item.customName}
                          secondary={`${item.dimensions.length} × ${item.dimensions.width} × ${item.dimensions.height} cm • ${item.volumeM3.toFixed(2)} m³`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => {
                            setEditingItem(item);
                            // Load item data into form
                            setFurnitureType(item.itemType);
                            setCustomName(item.customName || '');
                            setDimensions(item.dimensions);
                            setIsFragile(item.isFragile);
                            setRequiresDisassembly(item.requiresDisassembly);
                            setSpecialInstructions(item.specialInstructions || '');
                            setShowItemDialog(true);
                          }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" onClick={() => {
                            setScannedItems(prev => prev.filter(i => i.id !== item.id));
                          }}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
              </List>
            </Paper>
          )}

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setActiveStep(0)}>
              Zurück
            </Button>
            <Button 
              variant="contained" 
              endIcon={<NextIcon />}
              onClick={() => setActiveStep(2)}
              disabled={scannedItems.length === 0}
            >
              Zur Überprüfung
            </Button>
          </Box>
        </>
      )}

      {activeStep === 2 && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Scan-Zusammenfassung
          </Typography>
          
          {/* Total Volume */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6">
              Gesamtvolumen: {getTotalVolume().toFixed(2)} m³
            </Typography>
            <Typography variant="body2">
              {scannedItems.length} Gegenstände in {Object.keys(getItemsByRoom()).length} Räumen
            </Typography>
          </Alert>
          
          {/* Items by Room */}
          {Object.entries(getItemsByRoom()).map(([room, items]) => (
            <Box key={room} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                {room.replace('_', ' ')}
              </Typography>
              <List>
                {items.map(item => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={item.customName}
                      secondary={
                        <>
                          {item.dimensions.length} × {item.dimensions.width} × {item.dimensions.height} cm • 
                          {item.volumeM3.toFixed(2)} m³
                          {item.isFragile && <Chip label="Zerbrechlich" size="small" sx={{ ml: 1 }} />}
                          {item.requiresDisassembly && <Chip label="Demontage" size="small" sx={{ ml: 1 }} />}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Divider />
            </Box>
          ))}
          
          {/* Actions */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button onClick={() => setActiveStep(1)}>
              Weitere Gegenstände hinzufügen
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleFinishSession}
              disabled={loading}
            >
              Scan abschließen & speichern
            </Button>
          </Box>
        </Paper>
      )}

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onClose={() => setShowItemDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Gegenstand bearbeiten' : 'Neuen Gegenstand hinzufügen'}
        </DialogTitle>
        
        <DialogContent>
          {scanMode === 'photo' && !editingItem && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Fotos hochladen
              </Typography>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
              
              <Button
                variant="outlined"
                startIcon={<PhotoIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ mb: 2 }}
              >
                Fotos auswählen
              </Button>
              
              {selectedPhotos.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedPhotos.map((photo, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${index + 1}`}
                        style={{ width: 100, height: 100, objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'background.paper' }}
                        onClick={() => handleRemovePhoto(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Tipp: Fotografieren Sie das Möbelstück aus verschiedenen Winkeln für bessere Erkennung
                </Typography>
                {loading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2">AI analysiert Foto...</Typography>
                  </Box>
                )}
              </Alert>
            </Box>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Möbeltyp</InputLabel>
                <Select
                  value={furnitureType}
                  onChange={(e) => setFurnitureType(e.target.value as FurnitureType)}
                  label="Möbeltyp"
                >
                  {Object.entries(FURNITURE_DIMENSIONS).map(([type, furniture]) => (
                    <MenuItem key={type} value={type}>
                      {furniture.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bezeichnung"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={FURNITURE_DIMENSIONS[furnitureType].name}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Maße (in cm)
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Länge"
                type="number"
                value={dimensions.length}
                onChange={(e) => setDimensions({ ...dimensions, length: Number(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">cm</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Breite"
                type="number"
                value={dimensions.width}
                onChange={(e) => setDimensions({ ...dimensions, width: Number(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">cm</InputAdornment>
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Höhe"
                type="number"
                value={dimensions.height}
                onChange={(e) => setDimensions({ ...dimensions, height: Number(e.target.value) })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">cm</InputAdornment>
                }}
              />
            </Grid>
            
            {dimensions.length > 0 && dimensions.width > 0 && dimensions.height > 0 && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Volumen: {calculateVolume(dimensions).toFixed(2)} m³
                </Alert>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isFragile}
                    onChange={(e) => setIsFragile(e.target.checked)}
                  />
                }
                label="Zerbrechlich"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={requiresDisassembly}
                    onChange={(e) => setRequiresDisassembly(e.target.checked)}
                  />
                }
                label="Demontage erforderlich"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Besondere Hinweise"
                multiline
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="z.B. Kratzer an der Seite, besonders schwer, etc."
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => {
            setShowItemDialog(false);
            setEditingItem(null);
          }}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveItem}
            disabled={!dimensions.length || !dimensions.width || !dimensions.height || loading}
          >
            {editingItem ? 'Speichern' : 'Hinzufügen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      {error && (
        <Alert severity="error" sx={{ position: 'fixed', bottom: 20, left: 20, right: 20 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default VolumeScanner;