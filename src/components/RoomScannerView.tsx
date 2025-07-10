import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ViewInAr as ARIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Weekend as FurnitureIcon,
  SquareFoot as VolumeIcon,
  Door as DoorIcon,
  Window as WindowIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

interface RoomScanData {
  roomVolume: number;
  furniture: Array<{
    type: string;
    volume: number;
    dimensions: {
      width: number;
      height: number;
      depth: number;
    };
    confidence: number;
  }>;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  summary: {
    totalVolume: number;
    furnitureCount: number;
    wallCount: number;
    doorCount: number;
    windowCount: number;
  };
  exportPath?: string;
}

const RoomScannerView: React.FC = () => {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [scanning, setScanning] = useState(false);
  const [scanData, setScanData] = useState<RoomScanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    // Check if running in native app
    const checkNativeApp = () => {
      if (window.ReactNativeWebView || (window as any).isNativeApp) {
        setIsNativeApp(true);
      }
    };
    checkNativeApp();

    // Listen for messages from native app
    window.addEventListener('message', handleNativeMessage);
    return () => {
      window.removeEventListener('message', handleNativeMessage);
    };
  }, []);

  const handleNativeMessage = (event: MessageEvent) => {
    if (event.data.type === 'roomScanUpdate') {
      setProgress(event.data.progress || 0);
    } else if (event.data.type === 'roomScanComplete') {
      setScanData(event.data.data);
      setScanning(false);
    } else if (event.data.type === 'roomScanError') {
      setError(event.data.error);
      setScanning(false);
    }
  };

  const startScan = () => {
    if (isNativeApp) {
      // Send message to native app
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'startRoomScan',
        customerId
      }));
      setScanning(true);
      setError(null);
    } else {
      setError('Diese Funktion ist nur in der iOS App verfügbar. Bitte laden Sie die RELOCATO App aus dem App Store.');
    }
  };

  const downloadModel = () => {
    if (scanData?.exportPath) {
      // Trigger download
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'downloadModel',
        path: scanData.exportPath
      }));
    }
  };

  const shareResults = () => {
    if (scanData) {
      const text = `Raumscan Ergebnis:
Volumen: ${scanData.roomVolume.toFixed(2)} m³
Möbel: ${scanData.summary.furnitureCount} Stück
Maße: ${scanData.dimensions.length.toFixed(1)}m × ${scanData.dimensions.width.toFixed(1)}m × ${scanData.dimensions.height.toFixed(1)}m`;

      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'share',
        text,
        title: 'RELOCATO Raumscan'
      }));
    }
  };

  if (!isNativeApp) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ARIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            AR Raumscan
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Diese Funktion ist nur in der RELOCATO iOS App verfügbar.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              href="https://apps.apple.com/app/relocato"
              target="_blank"
            >
              App herunterladen
            </Button>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Button onClick={() => navigate(-1)}>
              Zurück
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" onClick={() => navigate(-1)}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            AR Raumscan
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {!scanning && !scanData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <ARIcon sx={{ fontSize: 100, color: 'primary.main', mb: 3 }} />
              <Typography variant="h4" gutterBottom>
                Raum mit AR scannen
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Nutzen Sie die AR-Technologie Ihres iPhones, um automatisch Räume zu vermessen.
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 3, mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <VolumeIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6">Automatische Vermessung</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Raumvolumen wird automatisch berechnet
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <FurnitureIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6">Möbelerkennung</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Möbel werden automatisch erkannt
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <DownloadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6">3D-Modell Export</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Exportieren Sie das 3D-Modell
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Button
                variant="contained"
                size="large"
                startIcon={<ARIcon />}
                onClick={startScan}
                sx={{ mt: 2 }}
              >
                Scan starten
              </Button>

              <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  <strong>Tipp:</strong> Bewegen Sie Ihr iPhone langsam und gleichmäßig durch den Raum. 
                  Die AR-Technologie erkennt automatisch Wände, Möbel und berechnet das Volumen.
                </Typography>
              </Alert>
            </Paper>
          </motion.div>
        )}

        {scanning && (
          <Paper sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CircularProgress size={80} thickness={4} />
              <Typography variant="h5" sx={{ mt: 3 }}>
                Raum wird gescannt...
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Bewegen Sie Ihr Gerät langsam durch den Raum
              </Typography>
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary" align="center">
              {progress}% abgeschlossen
            </Typography>
          </Paper>
        )}

        {scanData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{ p: 4, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CheckIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5">
                    Scan erfolgreich abgeschlossen
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date().toLocaleString('de-DE')}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Raumdaten
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <VolumeIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Gesamtvolumen"
                            secondary={`${scanData.roomVolume.toFixed(2)} m³`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText 
                            primary="Raummaße"
                            secondary={`${scanData.dimensions.length.toFixed(1)}m × ${scanData.dimensions.width.toFixed(1)}m × ${scanData.dimensions.height.toFixed(1)}m`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <DoorIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Türen"
                            secondary={scanData.summary.doorCount}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <WindowIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Fenster"
                            secondary={scanData.summary.windowCount}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Erkannte Möbel ({scanData.summary.furnitureCount})
                      </Typography>
                      <List dense>
                        {scanData.furniture.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <FurnitureIcon />
                            </ListItemIcon>
                            <ListItemText 
                              primary={item.type}
                              secondary={`${item.volume.toFixed(3)} m³`}
                            />
                            <Chip 
                              label={`${(item.confidence * 100).toFixed(0)}%`}
                              size="small"
                              color={item.confidence > 0.8 ? 'success' : 'warning'}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                {scanData.exportPath && (
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={downloadModel}
                  >
                    3D-Modell herunterladen
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={shareResults}
                >
                  Ergebnis teilen
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/customer-details/${customerId}`)}
                >
                  Fertig
                </Button>
              </Box>
            </Paper>
          </motion.div>
        )}

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default RoomScannerView;