import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Alert
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  AutoAwesome as AnalyzeIcon,
  Description as QuoteIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { featureFlagService, PHOENIX_FEATURES } from '../../../services/featureFlagService';
import GenesisEyeUpload from './GenesisEyeUpload';
import GenesisEyeResults from './GenesisEyeResults';

const steps = [
  {
    label: 'Fotos aufnehmen',
    description: 'Fotografieren Sie alle Räume und Gegenstände',
    icon: <CameraIcon />
  },
  {
    label: 'KI-Analyse',
    description: 'Automatische Erkennung und Inventarisierung',
    icon: <AnalyzeIcon />
  },
  {
    label: 'Angebot erstellen',
    description: 'Sofortiges, interaktives Angebot',
    icon: <QuoteIcon />
  }
];

const GenesisEye: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [analysisData, setAnalysisData] = useState<any>(null);
  
  // Check if Genesis Eye is enabled
  const isEnabled = featureFlagService.isEnabled(PHOENIX_FEATURES.GENESIS_EYE);
  const isAIVisionEnabled = featureFlagService.isEnabled(PHOENIX_FEATURES.GENESIS_EYE_AI_VISION);

  if (!isEnabled) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Genesis-Auge ist nicht aktiviert. Bitte aktivieren Sie das Feature im Phoenix Dashboard.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/phoenix')}
          sx={{ mt: 2 }}
        >
          Zum Phoenix Dashboard
        </Button>
      </Box>
    );
  }

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
    setActiveStep(2);
  };

  const handleCreateQuote = (config: any) => {
    // Here we would create the actual quote
    console.log('Creating quote with config:', config);
    
    // For now, navigate to quote creation with the data
    navigate('/create-quote', { 
      state: { 
        phoenixData: {
          ...analysisData,
          ...config
        } 
      } 
    });
  };

  const handleBack = () => {
    if (activeStep === 0) {
      navigate(-1);
    } else {
      setActiveStep(prev => prev - 1);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={handleBack}
        >
          Zurück
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Genesis-Auge
        </Typography>
      </Box>

      {!isAIVisionEnabled && (
        <Alert severity="info" sx={{ mb: 3 }}>
          KI-Vision ist deaktiviert. Die Analyse verwendet Beispieldaten. 
          Aktivieren Sie "Genesis-Auge AI Vision" im Phoenix Dashboard für echte KI-Analyse.
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                optional={
                  index === 2 ? (
                    <Typography variant="caption">Letzter Schritt</Typography>
                  ) : null
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {step.icon}
                  {step.label}
                </Box>
              </StepLabel>
              <StepContent>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  {step.description}
                </Typography>
                
                {index === 0 && (
                  <GenesisEyeUpload onAnalysisComplete={handleAnalysisComplete} />
                )}
                
                {index === 1 && (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <AnalyzeIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6">
                      KI analysiert Ihre Fotos...
                    </Typography>
                  </Box>
                )}
                
                {index === 2 && analysisData && (
                  <GenesisEyeResults 
                    analysisData={analysisData}
                    onCreateQuote={handleCreateQuote}
                  />
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          So funktioniert Genesis-Auge:
        </Typography>
        <Typography variant="body2" component="div">
          1. <strong>Fotografieren:</strong> Machen Sie Fotos von allen Räumen<br />
          2. <strong>KI-Analyse:</strong> Automatische Erkennung aller Möbel und Gegenstände<br />
          3. <strong>Sofort-Angebot:</strong> Erhalten Sie in 5 Minuten ein präzises Angebot<br />
          4. <strong>Interaktiv:</strong> Passen Sie Preis vs. Öko-Faktor an
        </Typography>
      </Alert>
    </Box>
  );
};

export default GenesisEye;