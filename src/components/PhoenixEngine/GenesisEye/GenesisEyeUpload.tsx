import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CameraAlt as CameraIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { visionService } from '../../../services/visionService';
import { featureFlagService, PHOENIX_FEATURES } from '../../../services/featureFlagService';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'analyzing' | 'complete' | 'error';
  analysis?: any;
  error?: string;
}

interface GenesisEyeUploadProps {
  onAnalysisComplete: (results: any) => void;
}

const GenesisEyeUpload: React.FC<GenesisEyeUploadProps> = ({ onAnalysisComplete }) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const isAIVisionEnabled = featureFlagService.isEnabled(PHOENIX_FEATURES.GENESIS_EYE_AI_VISION);

  useEffect(() => {
    if (isAIVisionEnabled) {
      visionService.initialize();
    }
  }, [isAIVisionEnabled]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const
    }));
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const analyzeImages = async () => {
    if (images.length === 0) return;

    setAnalyzing(true);
    setOverallProgress(0);
    
    const totalImages = images.length;
    let completed = 0;

    try {
      // Process each image
      for (const image of images) {
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'analyzing' } : img
        ));

        try {
          let analysis: any;
          
          if (isAIVisionEnabled) {
            // Use real GPT-4 Vision API
            analysis = await visionService.analyzeImage(image.file);
          } else {
            // Fallback to simulation
            analysis = await simulateImageAnalysis(image.file);
          }
          
          setImages(prev => prev.map(img => 
            img.id === image.id 
              ? { ...img, status: 'complete', analysis } 
              : img
          ));
        } catch (error: any) {
          setImages(prev => prev.map(img => 
            img.id === image.id 
              ? { ...img, status: 'error', error: error.message || 'Analyse fehlgeschlagen' } 
              : img
          ));
        }

        completed++;
        setOverallProgress((completed / totalImages) * 100);
      }

      // Compile all analyses
      const allAnalyses = images
        .filter(img => img.status === 'complete' && img.analysis)
        .map(img => img.analysis);

      if (allAnalyses.length > 0) {
        onAnalysisComplete(combineAnalyses(allAnalyses));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Simulate image analysis (placeholder for GPT-4 Vision)
  const simulateImageAnalysis = async (file: File): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    
    return {
      room: 'Wohnzimmer',
      items: [
        { name: 'Sofa', quantity: 1, volume: 2.5, weight: 80 },
        { name: 'Couchtisch', quantity: 1, volume: 0.5, weight: 30 },
        { name: 'TV-Schrank', quantity: 1, volume: 1.2, weight: 50 },
        { name: 'Bücherregal', quantity: 2, volume: 1.5, weight: 40 }
      ],
      estimatedVolume: 7.2,
      estimatedWeight: 240,
      packingMaterial: {
        boxes: 15,
        bubbleWrap: 20,
        packingPaper: 30
      },
      specialHandling: ['Zerbrechliche Gegenstände', 'Schwere Möbel']
    };
  };

  const combineAnalyses = (analyses: any[]): any => {
    // Combine all room analyses into one complete inventory
    const combined = {
      rooms: analyses.map(a => a.room),
      totalItems: analyses.flatMap(a => a.items),
      totalVolume: analyses.reduce((sum, a) => sum + a.estimatedVolume, 0),
      totalWeight: analyses.reduce((sum, a) => sum + a.estimatedWeight, 0),
      packingMaterial: {
        boxes: analyses.reduce((sum, a) => sum + a.packingMaterial.boxes, 0),
        bubbleWrap: analyses.reduce((sum, a) => sum + a.packingMaterial.bubbleWrap, 0),
        packingPaper: analyses.reduce((sum, a) => sum + a.packingMaterial.packingPaper, 0)
      },
      specialHandling: [...new Set(analyses.flatMap(a => a.specialHandling))]
    };
    return combined;
  };

  const getStatusIcon = (status: UploadedImage['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircleIcon color="success" />;
      case 'analyzing':
        return <CircularProgress size={20} />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Genesis-Auge: Raumerfassung
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Fotografieren Sie alle Räume, die umgezogen werden sollen. Die KI analysiert automatisch:
          • Möbel und Gegenstände
          • Geschätztes Volumen und Gewicht
          • Benötigtes Verpackungsmaterial
          • Besondere Anforderungen
        </Alert>

        {/* Upload Area */}
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.3s',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover'
            }
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Dateien hier ablegen' : 'Fotos hochladen oder hierher ziehen'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            JPG, PNG oder WebP • Max. 10MB pro Bild
          </Typography>
          <Button
            variant="contained"
            startIcon={<CameraIcon />}
            sx={{ mt: 2 }}
            onClick={(e) => e.stopPropagation()}
          >
            Foto aufnehmen
          </Button>
        </Box>
      </Paper>

      {/* Uploaded Images */}
      {images.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Hochgeladene Fotos ({images.length})
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={analyzing ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
              onClick={analyzeImages}
              disabled={analyzing || images.length === 0}
            >
              {analyzing ? 'Analysiere...' : 'Alle analysieren'}
            </Button>
          </Box>

          {analyzing && (
            <LinearProgress variant="determinate" value={overallProgress} sx={{ mb: 2 }} />
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {images.map((image) => (
              <Card key={image.id} sx={{ width: 200 }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={image.preview}
                  alt="Uploaded"
                />
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(image.status)}
                    <Typography variant="body2">
                      {image.status === 'pending' && 'Bereit'}
                      {image.status === 'analyzing' && 'Analysiere...'}
                      {image.status === 'complete' && 'Fertig'}
                      {image.status === 'error' && 'Fehler'}
                    </Typography>
                  </Box>
                  {image.analysis && (
                    <Chip 
                      label={image.analysis.room} 
                      size="small" 
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
                <CardActions>
                  <Tooltip title="Details anzeigen">
                    <IconButton size="small" disabled={!image.analysis}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Löschen">
                    <IconButton 
                      size="small" 
                      onClick={() => removeImage(image.id)}
                      disabled={analyzing}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default GenesisEyeUpload;