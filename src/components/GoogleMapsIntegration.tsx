import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Tooltip,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  DirectionsCar as DirectionsIcon,
  Route as RouteIcon,
  AccessTime as TimeIcon,
  Euro as EuroIcon,
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  Navigation as NavigationIcon,
  Traffic as TrafficIcon,
  Map as MapIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Calculate as CalculateIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { AnimatedCard, SlideInContainer } from './MicroAnimations';

interface Location {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

interface RouteInfo {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  estimatedCost: number;
  fuelCost: number;
  tollCost: number;
  points: google.maps.LatLng[];
}

interface PricingSettings {
  baseRate: number; // € per km
  fuelPrice: number; // € per liter
  fuelConsumption: number; // liters per 100km
  hourlyRate: number; // € per hour
  minimumCharge: number; // minimum € charge
  trafficMultiplier: number; // multiplier for traffic conditions
}

interface GoogleMapsIntegrationProps {
  onRouteCalculated?: (route: RouteInfo) => void;
  onLocationSelected?: (location: Location) => void;
  defaultOrigin?: string;
  defaultDestination?: string;
}

const GoogleMapsIntegration: React.FC<GoogleMapsIntegrationProps> = ({
  onRouteCalculated,
  onLocationSelected,
  defaultOrigin = '',
  defaultDestination = '',
}) => {
  const theme = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [selectedTravelMode, setSelectedTravelMode] = useState<google.maps.TravelMode>(google.maps.TravelMode.DRIVING);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pricing, setPricing] = useState<PricingSettings>({
    baseRate: 1.5,
    fuelPrice: 1.65,
    fuelConsumption: 12,
    hourlyRate: 85,
    minimumCharge: 150,
    trafficMultiplier: 1.2,
  });

  // Load Google Maps
  useEffect(() => {
    loadGoogleMaps();
  }, []);

  const loadGoogleMaps = async () => {
    // In a real implementation, you would load the Google Maps API
    // For this demo, we'll simulate the API loading
    setTimeout(() => {
      setIsLoaded(true);
      initializeMap();
    }, 1000);
  };

  const initializeMap = () => {
    if (!mapRef.current) return;

    // Simulate Google Maps initialization
    // In real implementation, this would create the actual map
    const mockMap = {
      center: { lat: 52.5200, lng: 13.4050 }, // Berlin
      zoom: 10,
    };

    // Simulate services initialization
    setIsLoaded(true);
  };

  const calculateRoute = useCallback(async () => {
    if (!origin || !destination) {
      alert('Bitte geben Sie sowohl Start- als auch Zieladresse ein.');
      return;
    }

    setIsCalculating(true);

    // Simulate route calculation
    setTimeout(() => {
      const mockRouteInfo: RouteInfo = {
        distance: {
          text: `${(15 + Math.random() * 20).toFixed(1)} km`,
          value: Math.floor((15 + Math.random() * 20) * 1000),
        },
        duration: {
          text: `${Math.floor(20 + Math.random() * 40)} Min`,
          value: Math.floor((20 + Math.random() * 40) * 60),
        },
        estimatedCost: 0,
        fuelCost: 0,
        tollCost: Math.random() > 0.7 ? 5.50 : 0,
        points: [], // Would contain actual route points
      };

      // Calculate costs
      const distanceKm = mockRouteInfo.distance.value / 1000;
      const durationHours = mockRouteInfo.duration.value / 3600;
      
      mockRouteInfo.fuelCost = (distanceKm * pricing.fuelConsumption / 100) * pricing.fuelPrice;
      mockRouteInfo.estimatedCost = Math.max(
        distanceKm * pricing.baseRate + mockRouteInfo.fuelCost + mockRouteInfo.tollCost,
        pricing.minimumCharge
      );

      setRouteInfo(mockRouteInfo);
      onRouteCalculated?.(mockRouteInfo);
      setIsCalculating(false);
    }, 2000);
  }, [origin, destination, pricing, onRouteCalculated]);

  const searchLocation = async (query: string): Promise<Location[]> => {
    // Simulate Google Places API search
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResults: Location[] = [
          {
            address: `${query}, Berlin, Deutschland`,
            lat: 52.5200 + (Math.random() - 0.5) * 0.1,
            lng: 13.4050 + (Math.random() - 0.5) * 0.1,
            placeId: `place_${Math.random()}`,
          },
          {
            address: `${query}, Hamburg, Deutschland`,
            lat: 53.5511 + (Math.random() - 0.5) * 0.1,
            lng: 9.9937 + (Math.random() - 0.5) * 0.1,
            placeId: `place_${Math.random()}`,
          },
          {
            address: `${query}, München, Deutschland`,
            lat: 48.1351 + (Math.random() - 0.5) * 0.1,
            lng: 11.5820 + (Math.random() - 0.5) * 0.1,
            placeId: `place_${Math.random()}`,
          },
        ];
        resolve(mockResults);
      }, 500);
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding would be done here
          setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Standort konnte nicht ermittelt werden.');
        }
      );
    } else {
      alert('Geolocation wird von diesem Browser nicht unterstützt.');
    }
  };

  const optimizeRoute = async (waypoints: string[]) => {
    // Simulate route optimization for multiple stops
    setIsCalculating(true);
    
    setTimeout(() => {
      // Mock optimization result
      const optimizedOrder = waypoints.sort(() => Math.random() - 0.5);
      alert(`Optimierte Reihenfolge: ${optimizedOrder.join(' → ')}`);
      setIsCalculating(false);
    }, 3000);
  };

  const savePricingSettings = (newSettings: PricingSettings) => {
    setPricing(newSettings);
    localStorage.setItem('relocato-pricing-settings', JSON.stringify(newSettings));
  };

  const loadPricingSettings = () => {
    const saved = localStorage.getItem('relocato-pricing-settings');
    if (saved) {
      try {
        setPricing(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading pricing settings:', error);
      }
    }
  };

  useEffect(() => {
    loadPricingSettings();
  }, []);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} Min`;
  };

  const getTrafficIcon = () => {
    if (!routeInfo) return <TrafficIcon />;
    
    const duration = routeInfo.duration.value;
    if (duration > 3600) return <TrafficIcon color="error" />;
    if (duration > 1800) return <TrafficIcon color="warning" />;
    return <TrafficIcon color="success" />;
  };

  return (
    <Box>
      {/* Header */}
      <SlideInContainer>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <MapIcon color="primary" />
              Google Maps Integration
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Preiseinstellungen">
                <IconButton onClick={() => setIsSettingsOpen(true)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              
              <Button
                variant="contained"
                startIcon={isCalculating ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
                onClick={calculateRoute}
                disabled={isCalculating || !isLoaded}
              >
                Route berechnen
              </Button>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Professionelle Entfernungsberechnung und Kostenermittlung für Umzugsdienste
          </Typography>
          
          {!isLoaded && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                Google Maps wird geladen...
              </Box>
            </Alert>
          )}
        </Paper>
      </SlideInContainer>

      {/* Route Planning Interface */}
      <SlideInContainer delay={200}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Routenplanung
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Startadresse"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  InputProps={{
                    startAdornment: <LocationIcon color="success" sx={{ mr: 1 }} />,
                  }}
                />
                <Tooltip title="Aktueller Standort">
                  <IconButton onClick={getCurrentLocation} disabled={!isLoaded}>
                    <MyLocationIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <TextField
                fullWidth
                label="Zieladresse"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                InputProps={{
                  startAdornment: <LocationIcon color="error" sx={{ mr: 1 }} />,
                }}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Verkehrsmittel</InputLabel>
                <Select
                  value={selectedTravelMode}
                  label="Verkehrsmittel"
                  onChange={(e) => setSelectedTravelMode(e.target.value as google.maps.TravelMode)}
                >
                  <MenuItem value="DRIVING">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DirectionsIcon />
                      Auto/LKW
                    </Box>
                  </MenuItem>
                  <MenuItem value="WALKING">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NavigationIcon />
                      Zu Fuß
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={() => searchLocation(origin)}
                  disabled={!isLoaded}
                >
                  Adressen suchen
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RouteIcon />}
                  onClick={() => optimizeRoute([origin, destination])}
                  disabled={!isLoaded}
                >
                  Route optimieren
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={7}>
              {/* Map Placeholder */}
              <Card elevation={1} sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <MapIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Google Maps Karte
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Interaktive Kartenansicht mit Routenanzeige
                  </Typography>
                  {!isLoaded && (
                    <Box sx={{ mt: 2 }}>
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </SlideInContainer>

      {/* Route Results */}
      {routeInfo && (
        <SlideInContainer delay={400}>
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Routeninformationen
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <AnimatedCard>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${alpha(theme.palette.info.main, 0.8)} 100%)`,
                      color: 'white',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <RouteIcon sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {routeInfo.distance.text}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Entfernung
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Box>
                </AnimatedCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <AnimatedCard delay={100}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${alpha(theme.palette.warning.main, 0.8)} 100%)`,
                      color: 'white',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TimeIcon sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {routeInfo.duration.text}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Fahrtzeit
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Box>
                </AnimatedCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <AnimatedCard delay={200}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`,
                      color: 'white',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <EuroIcon sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            €{routeInfo.estimatedCost.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Geschätzte Kosten
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Box>
                </AnimatedCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <AnimatedCard delay={300}>
                  <Box
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${alpha(theme.palette.secondary.main, 0.8)} 100%)`,
                      color: 'white',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {getTrafficIcon()}
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                            {routeInfo.tollCost > 0 ? `€${routeInfo.tollCost.toFixed(2)}` : 'Keine'}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Mautgebühren
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Box>
                </AnimatedCard>
              </Grid>
            </Grid>
            
            {/* Detailed Cost Breakdown */}
            <Card elevation={1} sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Kostenaufschlüsselung
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <RouteIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Grundpreis (Entfernung)"
                      secondary={`${(routeInfo.distance.value / 1000).toFixed(1)} km × €${pricing.baseRate}/km`}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      €{((routeInfo.distance.value / 1000) * pricing.baseRate).toFixed(2)}
                    </Typography>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <DirectionsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Kraftstoffkosten"
                      secondary={`${((routeInfo.distance.value / 1000) * pricing.fuelConsumption / 100).toFixed(1)}L × €${pricing.fuelPrice}/L`}
                    />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      €{routeInfo.fuelCost.toFixed(2)}
                    </Typography>
                  </ListItem>
                  
                  {routeInfo.tollCost > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <EuroIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Mautgebühren"
                        secondary="Geschätzte Autobahngebühren"
                      />
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        €{routeInfo.tollCost.toFixed(2)}
                      </Typography>
                    </ListItem>
                  )}
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <ListItem>
                    <ListItemText 
                      primary="Gesamtkosten"
                      primaryTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      €{routeInfo.estimatedCost.toFixed(2)}
                    </Typography>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Paper>
        </SlideInContainer>
      )}

      {/* Features Overview */}
      <SlideInContainer delay={600}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Maps Integration Features
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <CalculateIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Präzise Berechnungen
                    </Typography>
                  </Box>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="• Echtzeit-Verkehrsdaten" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="• Mehrere Routenoptionen" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="• Mautgebühren-Berechnung" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="• Kraftstoffverbrauch" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <LocationIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Adress-Services
                    </Typography>
                  </Box>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="• Autocomplete-Suche" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="• Geocoding/Reverse Geocoding" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="• Standortvalidierung" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="• GPS-Integration" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <TimelineIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Routenoptimierung
                    </Typography>
                  </Box>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="• Multi-Stop Routen" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="• Traveling Salesman" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="• Zeitfenster-Planung" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText primary="• Kapazitätsplanung" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </SlideInContainer>

      {/* Pricing Settings Dialog */}
      <Dialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Preiseinstellungen</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Grundpreis pro km (€)"
                type="number"
                value={pricing.baseRate}
                onChange={(e) => setPricing(prev => ({ ...prev, baseRate: parseFloat(e.target.value) || 0 }))}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Kraftstoffpreis (€/L)"
                type="number"
                value={pricing.fuelPrice}
                onChange={(e) => setPricing(prev => ({ ...prev, fuelPrice: parseFloat(e.target.value) || 0 }))}
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Verbrauch (L/100km)"
                type="number"
                value={pricing.fuelConsumption}
                onChange={(e) => setPricing(prev => ({ ...prev, fuelConsumption: parseFloat(e.target.value) || 0 }))}
                inputProps={{ step: 0.1, min: 0 }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Stundensatz (€/h)"
                type="number"
                value={pricing.hourlyRate}
                onChange={(e) => setPricing(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                inputProps={{ step: 1, min: 0 }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Mindestbetrag (€)"
                type="number"
                value={pricing.minimumCharge}
                onChange={(e) => setPricing(prev => ({ ...prev, minimumCharge: parseFloat(e.target.value) || 0 }))}
                inputProps={{ step: 1, min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Verkehrs-Multiplikator"
                type="number"
                value={pricing.trafficMultiplier}
                onChange={(e) => setPricing(prev => ({ ...prev, trafficMultiplier: parseFloat(e.target.value) || 1 }))}
                inputProps={{ step: 0.1, min: 1, max: 3 }}
                helperText="Faktor für erhöhte Kosten bei starkem Verkehr"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSettingsOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={() => {
              savePricingSettings(pricing);
              setIsSettingsOpen(false);
            }}
            variant="contained"
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Route */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, left: 16 }}
        onClick={() => {
          if (navigator.geolocation) {
            getCurrentLocation();
          }
        }}
      >
        <MyLocationIcon />
      </Fab>
    </Box>
  );
};

export default GoogleMapsIntegration;