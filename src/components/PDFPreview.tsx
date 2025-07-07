import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, IconButton } from '@mui/material';
import { 
  ZoomIn as ZoomInIcon, 
  ZoomOut as ZoomOutIcon,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import { PDFTemplate, TemplateContentBlock, CompanyBranding } from '../types/pdfTemplate';
import { generatePDFFromTemplate } from '../services/pdfTemplateGenerator';

interface PDFPreviewProps {
  template: PDFTemplate;
  contentBlocks: TemplateContentBlock[];
  companyBranding?: CompanyBranding;
  sampleData?: {
    customer?: any;
    quote?: any;
    invoice?: any;
  };
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  template,
  contentBlocks,
  companyBranding,
  sampleData
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1.5);

  useEffect(() => {
    generatePreview();
  }, [template, contentBlocks, companyBranding, currentPage, scale]);

  const generatePreview = async () => {
    try {
      setLoading(true);
      setError(null);

      // Import PDFjs dynamically
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

      // Generate PDF blob
      const pdfBlob = await generatePDFFromTemplate(
        template,
        contentBlocks,
        companyBranding,
        sampleData || getDefaultSampleData()
      );

      // Convert blob to array buffer
      const arrayBuffer = await pdfBlob.arrayBuffer();

      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);

      // Render current page
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      setLoading(false);
    } catch (err) {
      console.error('Error generating PDF preview:', err);
      setError('Fehler beim Generieren der Vorschau');
      setLoading(false);
    }
  };

  const getDefaultSampleData = () => {
    return {
      customer: {
        name: 'Max Mustermann',
        email: 'max@example.com',
        phone: '+49 123 456789',
        fromAddress: 'Alte Straße 123, 12345 Berlin',
        toAddress: 'Neue Straße 456, 54321 Hamburg',
        movingDate: new Date().toISOString()
      },
      quote: {
        id: 'Q-2024-001',
        price: 2500,
        volume: 35,
        distance: 450,
        services: {
          packingService: true,
          assemblyService: true,
          cleaningService: false
        }
      }
    };
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.25, 0.5));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          p: 1,
          backgroundColor: 'grey.100',
          borderRadius: 1
        }}
      >
        <IconButton onClick={handleZoomOut} size="small">
          <ZoomOutIcon />
        </IconButton>
        <Typography variant="body2">{Math.round(scale * 100)}%</Typography>
        <IconButton onClick={handleZoomIn} size="small">
          <ZoomInIcon />
        </IconButton>

        <Box sx={{ mx: 2, height: 24, width: 1, backgroundColor: 'divider' }} />

        <IconButton 
          onClick={handlePreviousPage} 
          disabled={currentPage === 1}
          size="small"
        >
          <NavigateBefore />
        </IconButton>
        <Typography variant="body2">
          Seite {currentPage} von {totalPages}
        </Typography>
        <IconButton 
          onClick={handleNextPage} 
          disabled={currentPage === totalPages}
          size="small"
        >
          <NavigateNext />
        </IconButton>
      </Box>

      {/* PDF Canvas */}
      <Box
        sx={{
          overflow: 'auto',
          maxHeight: '70vh',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'grey.50',
          display: 'flex',
          justifyContent: 'center',
          p: 2
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            backgroundColor: 'white'
          }}
        />
      </Box>
    </Box>
  );
};

export default PDFPreview;