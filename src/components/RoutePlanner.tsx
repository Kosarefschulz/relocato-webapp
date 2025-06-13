import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  Alert,
  Chip,
  CircularProgress,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  SwapVert as SwapIcon,
  DirectionsCar as CarIcon,
  AccessTime as TimeIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Map as MapIcon,
  Navigation as NavigationIcon,
} from '@mui/icons-material';
import { Customer } from '../types';

interface RoutePlannerProps {
  open: boolean;
  onClose: () => void;
  customer: Customer;
}

interface RouteStop {
  id: string;
  address: string;
  type: 'pickup' | 'delivery' | 'waypoint';
  estimatedTime?: string;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ open, onClose, customer }) => {
  const theme = useTheme();
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [additionalStop, setAdditionalStop] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (open && customer) {
      // Initialisiere mit Abhol- und Lieferadresse
      setStops([
        {
          id: 'pickup',
          address: customer.fromAddress,
          type: 'pickup',
        },
        {
          id: 'delivery',
          address: customer.toAddress,
          type: 'delivery',
        },
      ]);
      setRouteInfo(null);
    }
  }, [open, customer]);

  const addStop = () => {
    if (additionalStop.trim()) {
      const newStop: RouteStop = {
        id: `stop-${Date.now()}`,
        address: additionalStop,
        type: 'waypoint',
      };
      // Füge neuen Stop vor der Lieferadresse ein
      const newStops = [...stops];
      newStops.splice(stops.length - 1, 0, newStop);
      setStops(newStops);
      setAdditionalStop('');
    }
  };

  const removeStop = (stopId: string) => {
    setStops(stops.filter(stop => stop.id !== stopId));
  };

  const swapStops = () => {
    if (stops.length >= 2) {
      const newStops = [...stops];
      const pickup = newStops.find(s => s.type === 'pickup');
      const delivery = newStops.find(s => s.type === 'delivery');
      
      if (pickup && delivery) {
        pickup.type = 'delivery';
        delivery.type = 'pickup';
        // Tausche auch die Positionen
        const pickupIndex = newStops.findIndex(s => s.id === pickup.id);
        const deliveryIndex = newStops.findIndex(s => s.id === delivery.id);
        newStops[pickupIndex] = delivery;
        newStops[deliveryIndex] = pickup;
      }
      
      setStops(newStops);
    }
  };

  const calculateRoute = async () => {
    setCalculating(true);
    
    try {
      // Erstelle Google Maps URL mit allen Stops
      const origin = encodeURIComponent(stops[0].address);
      const destination = encodeURIComponent(stops[stops.length - 1].address);
      const waypoints = stops
        .slice(1, -1)
        .map(stop => encodeURIComponent(stop.address))
        .join('|');

      // Google Maps Directions URL
      let mapsUrl = `https://www.google.com/maps/dir/${origin}`;
      stops.slice(1).forEach(stop => {
        mapsUrl += `/${encodeURIComponent(stop.address)}`;
      });

      // Simuliere Berechnungsergebnis (in einer echten App würde man hier die Google Maps API nutzen)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Geschätzte Werte basierend auf Anzahl der Stops
      const baseDistance = 25; // km zwischen Hauptstops
      const baseTime = 30; // Minuten zwischen Hauptstops
      const totalDistance = baseDistance * (stops.length - 1);
      const totalTime = baseTime * (stops.length - 1) + (stops.length - 2) * 10; // +10 Min pro Zwischenstopp

      setRouteInfo({
        distance: `${totalDistance} km`,
        duration: `${Math.floor(totalTime / 60)} Std ${totalTime % 60} Min`,
        url: mapsUrl,
      });

    } catch (error) {
      console.error('Fehler beim Berechnen der Route:', error);
    } finally {
      setCalculating(false);
    }
  };

  const openInMaps = () => {
    if (routeInfo?.url) {
      window.open(routeInfo.url, '_blank');
    }
  };

  const openInNavigation = () => {
    if (stops.length > 0) {
      // Öffne in der Standard-Navigations-App (funktioniert besonders gut auf Mobilgeräten)
      const origin = stops[0].address;
      const destination = stops[stops.length - 1].address;
      
      // Für iOS und Android
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      let navUrl = '';
      if (isIOS) {
        // Apple Maps URL scheme
        navUrl = `maps://maps.apple.com/?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}`;
      } else if (isAndroid) {
        // Google Maps Navigation URL
        navUrl = `google.navigation:q=${encodeURIComponent(destination)}`;
      } else {
        // Fallback zu Google Maps im Browser
        navUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
      }
      
      window.open(navUrl, '_blank');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapIcon color="primary" />
            <Typography variant="h6">Route planen</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Planen Sie die optimale Route für Ihren Umzug mit allen Zwischenstopps
          </Alert>

          {/* Kunde Info */}
          <Paper sx={{ p: 2, mb: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Kunde
            </Typography>
            <Typography variant="h6">{customer.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Umzugstermin: {new Date(customer.movingDate).toLocaleDateString('de-DE')}
            </Typography>
          </Paper>

          {/* Route Stops */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Routenpunkte
              </Typography>
              <Button
                size="small"
                startIcon={<SwapIcon />}
                onClick={swapStops}
                disabled={stops.length < 2}
              >
                Tauschen
              </Button>
            </Box>

            <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
              {stops.map((stop, index) => (
                <React.Fragment key={stop.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      stop.type === 'waypoint' && (
                        <IconButton edge="end" onClick={() => removeStop(stop.id)} size="small">
                          <DeleteIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemIcon>
                      {stop.type === 'pickup' ? (
                        <HomeIcon color="primary" />
                      ) : stop.type === 'delivery' ? (
                        <LocationIcon color="success" />
                      ) : (
                        <LocationIcon color="action" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {stop.type === 'pickup' ? 'Abholung' : stop.type === 'delivery' ? 'Lieferung' : `Zwischenstopp ${index}`}
                          </Typography>
                          {index === 0 && <Chip label="Start" size="small" color="primary" />}
                          {index === stops.length - 1 && <Chip label="Ziel" size="small" color="success" />}
                        </Box>
                      }
                      secondary={stop.address}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Box>

          {/* Add Stop */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Zwischenstopp hinzufügen
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="z.B. Möbellager, Zwischenlagerung..."
                value={additionalStop}
                onChange={(e) => setAdditionalStop(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addStop()}
              />
              <Button
                variant="outlined"
                onClick={addStop}
                disabled={!additionalStop.trim()}
                startIcon={<AddIcon />}
              >
                Hinzufügen
              </Button>
            </Box>
          </Box>

          {/* Route Info */}
          {routeInfo && (
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Routeninformationen
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CarIcon color="action" />
                  <Typography variant="body1">{routeInfo.distance}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon color="action" />
                  <Typography variant="body1">{routeInfo.duration}</Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>Schließen</Button>
        
        {!routeInfo ? (
          <Button
            variant="contained"
            onClick={calculateRoute}
            disabled={calculating || stops.length < 2}
            startIcon={calculating ? <CircularProgress size={20} /> : <MapIcon />}
          >
            {calculating ? 'Berechne...' : 'Route berechnen'}
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={openInMaps}
              startIcon={<MapIcon />}
            >
              In Google Maps öffnen
            </Button>
            <Button
              variant="contained"
              onClick={openInNavigation}
              startIcon={<NavigationIcon />}
            >
              Navigation starten
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RoutePlanner;