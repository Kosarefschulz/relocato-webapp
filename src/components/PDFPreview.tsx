import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import {
  PDFTemplate,
  CompanyBranding,
  ServiceCatalogItem,
  PDFGenerationData
} from '../types/pdfTemplate';
import { pdfTemplateGenerator } from '../services/pdfTemplateGenerator';

interface PDFPreviewProps {
  template: PDFTemplate;
  branding: CompanyBranding | null;
  services: ServiceCatalogItem[];
  customer?: any;
  quote?: any;
  invoice?: any;
  onClose: () => void;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({
  template,
  branding,
  services,
  customer,
  quote,
  invoice,
  onClose
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    generatePreview();
    
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  const generatePreview = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create sample data if not provided
      const sampleCustomer = customer || {
        name: 'Max Mustermann',
        email: 'max.mustermann@example.com',
        phone: '+49 123 456789',
        address: 'Musterstraße 123',
        city: 'Musterstadt',
        zip: '12345',
        salutation: 'Herr'
      };

      const sampleQuote = quote || {
        number: `ANR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        date: new Date(),
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        total: 1500.00,
        items: [
          {
            name: 'Umzugsservice',
            description: 'Kompletter Umzugsservice inkl. Transport',
            quantity: 1,
            price: 1000.00
          },
          {
            name: 'Verpackungsmaterial',
            description: '50 Umzugskartons und Verpackungsmaterial',
            quantity: 50,
            price: 250.00
          },
          {
            name: 'Möbelmontage',
            description: 'De- und Montage von Möbeln',
            quantity: 4,
            price: 250.00
          }
        ]
      };

      const data: PDFGenerationData = {
        template,
        branding: branding || {
          id: '',
          companyType: template.companyType,
          primaryColor: '#000000',
          secondaryColor: '#666666',
          accentColor: '#0066CC',
          fontFamily: 'Helvetica',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        customer: sampleCustomer,
        quote: sampleQuote,
        invoice,
        services: services.slice(0, 5), // Use first 5 services for preview
        variables: {
          companyName: 'Beispiel GmbH',
          date: new Date().toLocaleDateString('de-DE'),
          year: new Date().getFullYear()
        }
      };

      const blob = await pdfTemplateGenerator.generatePDF(data);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('Error generating preview:', err);
      setError('Fehler beim Generieren der Vorschau');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;

    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${template.name}_Vorschau.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 25, 50));
  };

  const handleFullscreen = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Vorschau: {template.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleZoomOut} disabled={!pdfUrl || zoom <= 50}>
              <ZoomOutIcon />
            </IconButton>
            <Typography sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
              {zoom}%
            </Typography>
            <IconButton onClick={handleZoomIn} disabled={!pdfUrl || zoom >= 200}>
              <ZoomInIcon />
            </IconButton>
            <IconButton onClick={handleFullscreen} disabled={!pdfUrl}>
              <FullscreenIcon />
            </IconButton>
            <IconButton onClick={handleDownload} disabled={!pdfUrl}>
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {pdfUrl && !loading && (
          <Box sx={{ 
            width: '100%', 
            height: '70vh',
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5'
          }}>
            <iframe
              src={pdfUrl}
              width={`${zoom}%`}
              height="100%"
              style={{ 
                border: 'none',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              title="PDF Preview"
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Schließen
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PDFPreview;