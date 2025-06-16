import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  IconButton,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  Clear as ClearIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { SignatureData } from '../services/pdfSignatureService';

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSign: (signatureData: SignatureData) => void;
  documentName: string;
  signerType: 'customer' | 'employee';
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  open,
  onClose,
  onSign,
  documentName,
  signerType
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Biometric data collection
  const [biometricData] = useState({
    pressure: [] as number[],
    velocity: [] as number[],
    acceleration: [] as number[]
  });
  
  const lastPoint = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    if (open && canvasRef.current) {
      setupCanvas();
    }
  }, [open]);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasSignature(true);
    const point = getCoordinates(e);
    if (point) {
      lastPoint.current = { ...point, time: Date.now() };
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const currentPoint = getCoordinates(e);
    if (!currentPoint || !lastPoint.current) return;

    // Calculate velocity
    const timeDiff = Date.now() - lastPoint.current.time;
    const distance = Math.sqrt(
      Math.pow(currentPoint.x - lastPoint.current.x, 2) +
      Math.pow(currentPoint.y - lastPoint.current.y, 2)
    );
    const velocity = distance / timeDiff;
    
    // Store biometric data
    biometricData.velocity.push(velocity);
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    lastPoint.current = { ...currentPoint, time: Date.now() };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    setHasSignature(false);
    biometricData.pressure.length = 0;
    biometricData.velocity.length = 0;
    biometricData.acceleration.length = 0;
  };

  const handleSign = async () => {
    if (!signerName.trim()) {
      setError('Bitte geben Sie Ihren Namen ein');
      return;
    }

    if (!hasSignature) {
      setError('Bitte unterschreiben Sie im Feld oben');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas nicht gefunden');

      // Convert canvas to base64
      const signatureBase64 = canvas.toDataURL('image/png');

      const signatureData: SignatureData = {
        signature: signatureBase64,
        signedBy: signerName,
        signedAt: new Date(),
        ipAddress: await getIPAddress(),
        biometricData: {
          pressure: [...biometricData.pressure],
          velocity: [...biometricData.velocity],
          acceleration: [...biometricData.acceleration]
        }
      };

      onSign(signatureData);
      onClose();
    } catch (err) {
      setError('Fehler beim Speichern der Unterschrift');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIPAddress = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'Unbekannt';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Digitale Unterschrift für {documentName}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label={signerType === 'customer' ? 'Ihr Name' : 'Mitarbeiter Name'}
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            sx={{ mb: 3 }}
            required
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Bitte unterschreiben Sie im Feld unten:
          </Typography>
          
          <Box
            sx={{
              position: 'relative',
              border: `2px solid ${theme.palette.divider}`,
              borderRadius: 1,
              backgroundColor: '#fff',
              mb: 2
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{
                width: '100%',
                height: 200,
                cursor: 'crosshair',
                touchAction: 'none'
              }}
            />
            
            {hasSignature && (
              <IconButton
                onClick={clearSignature}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
                size="small"
              >
                <ClearIcon />
              </IconButton>
            )}
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            Mit Ihrer Unterschrift bestätigen Sie die Richtigkeit der Angaben und stimmen 
            den Bedingungen zu. Diese digitale Unterschrift ist rechtlich bindend.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Abbrechen
        </Button>
        <Button
          onClick={handleSign}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={loading || !hasSignature || !signerName.trim()}
        >
          {loading ? 'Wird gespeichert...' : 'Unterschrift speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignatureModal;