import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Slider,
  FormControlLabel,
  Switch,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Tabs,
  Tab
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Scale as ScaleIcon,
  Archive as ArchiveIcon,
  Warning as WarningIcon,
  Euro as EuroIcon,
  Schedule as ScheduleIcon,
  LocalShipping as TruckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Nature as EcoIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface GenesisEyeResultsProps {
  analysisData: any;
  onCreateQuote: (config: any) => void;
}

const GenesisEyeResults: React.FC<GenesisEyeResultsProps> = ({ analysisData, onCreateQuote }) => {
  const [priceVsEco, setPriceVsEco] = useState(50);
  const [includePackaging, setIncludePackaging] = useState(true);
  const [includeCleaning, setIncludeCleaning] = useState(false);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Calculate pricing based on slider position
  const calculatePricing = () => {
    const basePrice = analysisData.totalVolume * 80; // €80 per m³ base
    const ecoMultiplier = 1 + (priceVsEco / 100) * 0.3; // Up to 30% more for eco
    const speedMultiplier = 1 - ((100 - priceVsEco) / 100) * 0.2; // Up to 20% less for speed
    
    return {
      price: basePrice * speedMultiplier * ecoMultiplier,
      duration: Math.max(4, 8 - (100 - priceVsEco) / 25), // 4-8 hours based on speed
      ecoScore: Math.round(priceVsEco / 10), // 0-10 eco score
      recyclingRate: 50 + priceVsEco / 2 // 50-100% recycling
    };
  };

  const pricing = calculatePricing();

  const handleCreateQuote = () => {
    const config = {
      items: analysisData.totalItems,
      volume: analysisData.totalVolume,
      weight: analysisData.totalWeight,
      pricing: pricing,
      options: {
        includePackaging,
        includeCleaning,
        ecoLevel: priceVsEco
      }
    };
    onCreateQuote(config);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
          Analyse abgeschlossen
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 3 }}>
          <Card sx={{ flex: '1 1 200px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon color="primary" />
                <Typography variant="h6">
                  {analysisData.totalItems.length}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Gegenstände erkannt
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ flex: '1 1 200px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArchiveIcon color="primary" />
                <Typography variant="h6">
                  {analysisData.totalVolume.toFixed(1)} m³
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Geschätztes Volumen
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ flex: '1 1 200px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScaleIcon color="primary" />
                <Typography variant="h6">
                  {analysisData.totalWeight} kg
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Geschätztes Gewicht
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Inventar" />
          <Tab label="Konfiguration" />
          <Tab label="Materialien" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* Inventory Tab */}
          {activeTab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Gegenstand</TableCell>
                    <TableCell align="right">Anzahl</TableCell>
                    <TableCell align="right">Volumen (m³)</TableCell>
                    <TableCell align="right">Gewicht (kg)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analysisData.totalItems.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{item.volume.toFixed(2)}</TableCell>
                      <TableCell align="right">{item.weight}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {/* Configuration Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Preis vs. Öko-Faktor
              </Typography>
              <Box sx={{ px: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon />
                    <Typography>Günstig & Schnell</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Öko & Nachhaltig</Typography>
                    <EcoIcon />
                  </Box>
                </Box>
                <Slider
                  value={priceVsEco}
                  onChange={(e, v) => setPriceVsEco(v as number)}
                  marks
                  step={10}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Zusatzleistungen
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={includePackaging}
                    onChange={(e) => setIncludePackaging(e.target.checked)}
                  />
                }
                label="Verpackungsservice (+15%)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={includeCleaning}
                    onChange={(e) => setIncludeCleaning(e.target.checked)}
                  />
                }
                label="Endreinigung (+€150)"
              />
            </Box>
          )}
          
          {/* Materials Tab */}
          {activeTab === 2 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Benötigtes Verpackungsmaterial (geschätzt)
              </Alert>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <ArchiveIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Umzugskartons"
                    secondary={`${analysisData.packingMaterial.boxes} Stück`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ArchiveIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Luftpolsterfolie"
                    secondary={`${analysisData.packingMaterial.bubbleWrap} m²`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ArchiveIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Packpapier"
                    secondary={`${analysisData.packingMaterial.packingPaper} kg`}
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Quote Preview */}
      <Paper sx={{ p: 3, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          Ihr Angebot
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h3">
              €{pricing.price.toFixed(0)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {includePackaging && '+ Verpackungsservice'}
              {includeCleaning && ' + Endreinigung'}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ScheduleIcon />
              <Typography>{pricing.duration} Stunden</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EcoIcon />
              <Typography>Öko-Score: {pricing.ecoScore}/10</Typography>
            </Box>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleCreateQuote}
          sx={{ 
            backgroundColor: 'white', 
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'grey.100'
            }
          }}
        >
          Angebot erstellen
        </Button>
      </Paper>
      
      {analysisData.specialHandling.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Besondere Hinweise:
          </Typography>
          {analysisData.specialHandling.map((item: string, index: number) => (
            <Typography key={index} variant="body2">• {item}</Typography>
          ))}
        </Alert>
      )}
    </Box>
  );
};

export default GenesisEyeResults;