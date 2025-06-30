import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  useTheme,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudDownload as ImportIcon
} from '@mui/icons-material';
import { TrelloImport } from '../components/TrelloImport';

const TrelloImportPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [importDialogOpen, setImportDialogOpen] = useState(true);

  const handleClose = () => {
    navigate('/customers');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton onClick={() => navigate('/customers')} edge="start">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Trello-Import
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 4, border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ textAlign: 'center' }}>
          <ImportIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Kundendaten aus Trello importieren
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Importieren Sie Fotos, Notizen und Tags aus Ihren Trello-Boards direkt zu bestehenden Kunden.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2" gutterBottom>
              <strong>So funktioniert's:</strong>
            </Typography>
            <Box component="ol" sx={{ pl: 2, mb: 0 }}>
              <Typography component="li" variant="body2" gutterBottom>
                Trello-Karten werden anhand des Namens mit bestehenden Kunden abgeglichen
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                Fotos aus Anhängen werden automatisch hochgeladen
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                Beschreibungen werden als Notizen importiert
              </Typography>
              <Typography component="li" variant="body2">
                Labels werden als Tags übernommen
              </Typography>
            </Box>
          </Alert>

          <Button
            variant="contained"
            size="large"
            startIcon={<ImportIcon />}
            onClick={() => setImportDialogOpen(true)}
          >
            Import starten
          </Button>
        </Box>
      </Paper>

      <TrelloImport 
        open={importDialogOpen} 
        onClose={handleClose}
      />
    </Container>
  );
};

export default TrelloImportPage;