import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import { 
  Email as EmailIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Api as ApiIcon
} from '@mui/icons-material';

export const EmailTestDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [emailTo, setEmailTo] = useState('sergej.schulz@relocato.de');
  const [emailSubject, setEmailSubject] = useState('Test Email von RELOCATO®');

  const addTestResult = (test: string, success: boolean, message: string, details?: any) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const testSimpleEndpoint = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/simple-test');
      const data = await response.json();
      
      addTestResult(
        'Simple API Test',
        response.ok,
        response.ok ? 'API Route funktioniert!' : 'API Route fehlgeschlagen',
        data
      );
    } catch (error: any) {
      addTestResult('Simple API Test', false, error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSmartEmail = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email-smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>🚀 RELOCATO® Email Test</h2>
              <p>Diese Email wurde über das Smart Email System gesendet.</p>
              <p><strong>Zeitstempel:</strong> ${new Date().toLocaleString('de-DE')}</p>
              <hr>
              <p>Mit freundlichen Grüßen,<br>Ihr RELOCATO® Team</p>
            </div>
          `
        })
      });
      
      const data = await response.json();
      
      addTestResult(
        'Smart Email Service',
        data.success,
        data.success ? `Email erfolgreich über ${data.provider} gesendet!` : 'Email-Versand fehlgeschlagen',
        data
      );
    } catch (error: any) {
      addTestResult('Smart Email Service', false, error.message);
    } finally {
      setLoading(false);
    }
  };

  const testBrevoEmail = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email-brevo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailTo,
          subject: `${emailSubject} (Brevo)`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>📧 RELOCATO® Brevo Test</h2>
              <p>Diese Email wurde über Brevo API gesendet (9000 kostenlose Emails/Monat).</p>
              <p><strong>Zeit:</strong> ${new Date().toLocaleString('de-DE')}</p>
            </div>
          `
        })
      });
      
      const data = await response.json();
      
      addTestResult(
        'Brevo Email API',
        data.success,
        data.success ? 'Email über Brevo gesendet!' : data.hint || 'Brevo fehlgeschlagen',
        data
      );
    } catch (error: any) {
      addTestResult('Brevo Email API', false, error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          📧 Email System Test Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Testen Sie die verschiedenen Email-Services für RELOCATO®
        </Typography>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Email Test-Einstellungen
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Empfänger Email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              fullWidth
              type="email"
            />
            <TextField
              label="Betreff"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              fullWidth
            />
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <Button
          variant="contained"
          startIcon={<ApiIcon />}
          onClick={testSimpleEndpoint}
          disabled={loading}
        >
          API Test
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SendIcon />}
          onClick={testSmartEmail}
          disabled={loading}
        >
          Smart Email
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<EmailIcon />}
          onClick={testBrevoEmail}
          disabled={loading}
        >
          Brevo Email
        </Button>
        <Button
          variant="outlined"
          onClick={clearResults}
          disabled={loading || testResults.length === 0}
        >
          Ergebnisse löschen
        </Button>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <Stack spacing={2}>
        {testResults.map((result, index) => (
          <Card key={index} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {result.success ? (
                  <CheckIcon color="success" sx={{ mr: 1 }} />
                ) : (
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                )}
                <Typography variant="h6">
                  {result.test}
                </Typography>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    label={result.success ? 'Erfolgreich' : 'Fehlgeschlagen'}
                    color={result.success ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>
              
              <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                {result.message}
              </Alert>
              
              {result.details && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" component="pre" sx={{ 
                    backgroundColor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: '0.85rem'
                  }}>
                    {JSON.stringify(result.details, null, 2)}
                  </Typography>
                </>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {new Date(result.timestamp).toLocaleString('de-DE')}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {testResults.length === 0 && !loading && (
        <Alert severity="info">
          Klicken Sie auf einen der Test-Buttons, um die Email-Services zu testen.
        </Alert>
      )}
    </Box>
  );
};