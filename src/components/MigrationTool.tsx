import React, { useState } from 'react';
import { Box, Paper, Typography, Button, LinearProgress, Alert, Stack, Divider, Chip, Card, CardContent } from '@mui/material';
import Grid from './GridCompat';
import {
  CloudUpload as MigrateIcon,
  Compare as CompareIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { migrationService } from '../services/migrationService';

interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  status: string;
}

interface ComparisonResult {
  googleSheets: { customers: number; quotes: number; invoices: number };
  firestore: { customers: number; quotes: number; invoices: number };
  differences: string[];
}

const MigrationTool: React.FC = () => {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCompare = async () => {
    setError(null);
    try {
      const result = await migrationService.compareDataSources();
      setComparison(result);
    } catch (err) {
      setError('Fehler beim Datenvergleich: ' + (err as Error).message);
    }
  };

  const handleTestMigration = async () => {
    setError(null);
    setSuccess(null);
    try {
      // Test mit dem ersten nicht-Demo Kunden
      const customers = await migrationService.compareDataSources();
      if (customers.googleSheets.customers > 0) {
        setMigrating(true);
        // Hier könnten Sie einen spezifischen Kunden auswählen
        await migrationService.testMigrationWithSingleCustomer('local_1');
        setSuccess('Test-Migration erfolgreich abgeschlossen!');
      } else {
        setError('Keine Kunden zum Testen gefunden');
      }
    } catch (err) {
      setError('Test-Migration fehlgeschlagen: ' + (err as Error).message);
    } finally {
      setMigrating(false);
    }
  };

  const handleFullMigration = async () => {
    const confirmed = window.confirm(
      'Sind Sie sicher, dass Sie ALLE Daten von Google Sheets zu Firestore migrieren möchten?\n\nDieser Vorgang kann einige Minuten dauern.'
    );

    if (!confirmed) return;

    setMigrating(true);
    setError(null);
    setSuccess(null);
    setProgress({ total: 0, completed: 0, failed: 0, status: 'Starte Migration...' });

    try {
      await migrationService.migrateAllData((progress) => {
        setProgress(progress);
      });
      setSuccess('Migration erfolgreich abgeschlossen!');
      
      // Aktualisiere Vergleich
      await handleCompare();
    } catch (err) {
      setError('Migration fehlgeschlagen: ' + (err as Error).message);
    } finally {
      setMigrating(false);
    }
  };

  const progressPercentage = progress
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Firebase Migration Tool
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Dieses Tool hilft Ihnen, Ihre Daten von Google Sheets zu Firestore zu migrieren.
          Die Migration ist sicher und überschreibt keine bestehenden Daten.
        </Typography>
      </Alert>

      {/* Datenvergleich */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompareIcon /> Datenvergleich
        </Typography>
        
        <Button
          variant="outlined"
          onClick={handleCompare}
          disabled={migrating}
          sx={{ mb: 2 }}
        >
          Datenquellen vergleichen
        </Button>

        {comparison && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Google Sheets
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Kunden:</Typography>
                      <Chip label={comparison.googleSheets.customers} size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Angebote:</Typography>
                      <Chip label={comparison.googleSheets.quotes} size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Rechnungen:</Typography>
                      <Chip label={comparison.googleSheets.invoices} size="small" />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Firestore
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Kunden:</Typography>
                      <Chip 
                        label={comparison.firestore.customers} 
                        size="small"
                        color={comparison.firestore.customers === comparison.googleSheets.customers ? 'success' : 'default'}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Angebote:</Typography>
                      <Chip 
                        label={comparison.firestore.quotes} 
                        size="small"
                        color={comparison.firestore.quotes === comparison.googleSheets.quotes ? 'success' : 'default'}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Rechnungen:</Typography>
                      <Chip 
                        label={comparison.firestore.invoices} 
                        size="small"
                        color={comparison.firestore.invoices === comparison.googleSheets.invoices ? 'success' : 'default'}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {comparison.differences.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Unterschiede gefunden:</Typography>
                  {comparison.differences.map((diff, index) => (
                    <Typography key={index} variant="body2">• {diff}</Typography>
                  ))}
                </Alert>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Migration */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MigrateIcon /> Daten-Migration
        </Typography>

        <Stack spacing={2}>
          <Button
            variant="outlined"
            onClick={handleTestMigration}
            disabled={migrating}
            startIcon={<InfoIcon />}
          >
            Test-Migration (1 Kunde)
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={handleFullMigration}
            disabled={migrating}
            startIcon={<MigrateIcon />}
          >
            Vollständige Migration starten
          </Button>

          {migrating && progress && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                {progress.status}
              </Typography>
              <LinearProgress variant="determinate" value={progressPercentage} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {progress.completed} von {progress.total} verarbeitet
                {progress.failed > 0 && ` (${progress.failed} fehlgeschlagen)`}
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Status-Meldungen */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Warnung */}
      <Alert severity="warning" sx={{ mt: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          <WarningIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Wichtige Hinweise:
        </Typography>
        <Typography variant="body2">
          • Die Migration überschreibt keine bestehenden Daten in Firestore
        </Typography>
        <Typography variant="body2">
          • Google Sheets bleibt als Backup erhalten
        </Typography>
        <Typography variant="body2">
          • Demo-Daten werden nicht migriert
        </Typography>
      </Alert>
    </Box>
  );
};

export default MigrationTool;