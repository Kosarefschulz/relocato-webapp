import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  TextField,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Link as LinkIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { firebaseService } from '../services/firebaseService';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface ShareLink {
  id: string;
  customerId: string;
  quoteId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  createdBy?: string;
  usedAt?: Date;
  arbeitsscheinHTML?: string;
}

const DebugShareLinksPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchToken, setSearchToken] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [testCustomerId, setTestCustomerId] = useState('TEST_CUSTOMER_123');
  const [testQuoteId, setTestQuoteId] = useState('TEST_QUOTE_456');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    loadShareLinks();
  }, []);

  const loadShareLinks = async () => {
    setLoading(true);
    try {
      if (!db) {
        console.error('Firebase nicht initialisiert');
        return;
      }

      const shareLinksCollection = collection(db, 'shareLinks');
      const snapshot = await getDocs(shareLinksCollection);
      
      const links: ShareLink[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        links.push({
          id: doc.id,
          customerId: data.customerId,
          quoteId: data.quoteId,
          token: data.token,
          expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          createdBy: data.createdBy,
          usedAt: data.usedAt?.toDate ? data.usedAt.toDate() : undefined,
          arbeitsscheinHTML: data.arbeitsscheinHTML,
        });
      });

      setShareLinks(links.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Fehler beim Laden der ShareLinks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestLink = async () => {
    try {
      console.log('🔧 Erstelle Test-ShareLink...');
      const shareLink = await firebaseService.createShareLink(
        testCustomerId,
        testQuoteId,
        'debug-page',
        {
          arbeitsscheinHTML: '<h1>Test Arbeitsschein</h1><p>Dies ist ein Test-Arbeitsschein für Debug-Zwecke.</p>',
          arbeitsscheinData: JSON.stringify({ test: true, createdAt: new Date().toISOString() })
        }
      );

      console.log('✅ Test-ShareLink erstellt:', shareLink);
      
      // Show success message
      alert(`Test-Link erstellt!\n\nToken: ${shareLink.token}\nURL: ${window.location.origin}/share/${shareLink.token}`);
      
      setCreateDialogOpen(false);
      
      // Reload after a short delay to ensure Firebase has processed the write
      setTimeout(() => {
        loadShareLinks();
      }, 1000);
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Test-Links:', error);
      alert('Fehler beim Erstellen des Test-Links. Siehe Konsole für Details.');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!window.confirm('Möchten Sie diesen ShareLink wirklich löschen?')) {
      return;
    }

    try {
      const shareLinksCollection = collection(db, 'shareLinks');
      await deleteDoc(doc(shareLinksCollection, linkId));
      loadShareLinks();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCopyUrl = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const isExpired = (expiresAt: Date) => {
    return new Date() > new Date(expiresAt);
  };

  const filteredLinks = searchToken
    ? shareLinks.filter(link => 
        link.token.toLowerCase().includes(searchToken.toLowerCase()) ||
        link.customerId.toLowerCase().includes(searchToken.toLowerCase()) ||
        link.quoteId.toLowerCase().includes(searchToken.toLowerCase())
      )
    : shareLinks;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default,
      pb: 4,
    }}>
      <Container maxWidth="xl" sx={{ pt: 3 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              ShareLinks Debug
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => setCreateDialogOpen(true)}
              >
                Test-Link erstellen
              </Button>
              <Button
                startIcon={<RefreshIcon />}
                variant="outlined"
                onClick={loadShareLinks}
                disabled={loading}
              >
                Aktualisieren
              </Button>
            </Stack>
          </Stack>
          
          <Alert severity="info">
            Diese Seite zeigt alle ShareLinks in Firebase. Sie können Test-Links erstellen und die Funktionalität testen.
          </Alert>
        </Paper>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Suche nach Token, Customer ID oder Quote ID..."
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Paper>

        {/* Stats */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Gesamt
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {shareLinks.length}
            </Typography>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aktiv
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
              {shareLinks.filter(l => !isExpired(l.expiresAt)).length}
            </Typography>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Abgelaufen
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
              {shareLinks.filter(l => isExpired(l.expiresAt)).length}
            </Typography>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Verwendet
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
              {shareLinks.filter(l => l.usedAt).length}
            </Typography>
          </Paper>
        </Box>

        {/* Table */}
        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Token</TableCell>
                  <TableCell>Customer ID</TableCell>
                  <TableCell>Quote ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Erstellt</TableCell>
                  <TableCell>Läuft ab</TableCell>
                  <TableCell>Arbeitsschein</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLinks.map((link) => (
                  <TableRow key={link.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {link.token.substring(0, 12)}...
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyToken(link.token)}
                        >
                          {copiedToken === link.token ? <CheckIcon color="success" /> : <CopyIcon />}
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>{link.customerId}</TableCell>
                    <TableCell>{link.quoteId}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {isExpired(link.expiresAt) ? (
                          <Chip label="Abgelaufen" color="error" size="small" />
                        ) : (
                          <Chip label="Aktiv" color="success" size="small" />
                        )}
                        {link.usedAt && (
                          <Chip label="Verwendet" color="info" size="small" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {format(link.createdAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell>
                      {format(link.expiresAt, 'dd.MM.yyyy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell>
                      {link.arbeitsscheinHTML ? (
                        <CheckIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          startIcon={<LinkIcon />}
                          onClick={() => handleCopyUrl(link.token)}
                        >
                          URL kopieren
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/share/${link.token}`)}
                        >
                          Öffnen
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteLink(link.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Create Test Link Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Test-ShareLink erstellen</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Customer ID"
                value={testCustomerId}
                onChange={(e) => setTestCustomerId(e.target.value)}
                fullWidth
              />
              <TextField
                label="Quote ID"
                value={testQuoteId}
                onChange={(e) => setTestQuoteId(e.target.value)}
                fullWidth
              />
              <Alert severity="info">
                Der Link wird mit Test-Arbeitsschein-Daten erstellt und ist 7 Tage gültig.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleCreateTestLink} variant="contained">
              Erstellen
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default DebugShareLinksPage;