import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Email as EmailIcon,
  Send as SendIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const EmailTestIONOS: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [imapResult, setImapResult] = useState<any>(null);
  const [smtpResult, setSmtpResult] = useState<any>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testIMAPConnection = async () => {
    setTesting(true);
    setImapResult(null);
    setEmails([]);

    try {
      // First test basic connection
      const response = await fetch('/api/test-ionos-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      setImapResult(result);
      
      // If connection successful, try to get emails
      if (result.success) {
        try {
          const emailResponse = await fetch('/api/test-ionos-imap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (emailResponse.ok) {
            const emailResult = await emailResponse.json();
            if (emailResult.emails) {
              setEmails(emailResult.emails);
            }
          }
        } catch (e) {
          console.log('Could not fetch emails, but connection works');
        }
      }
    } catch (error: any) {
      setImapResult({
        success: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const testSMTPConnection = async () => {
    setSendingTest(true);
    setSmtpResult(null);

    try {
      const response = await fetch('/api/test-ionos-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail || 'bielefeld@relocato.de',
          subject: 'IONOS SMTP Test',
          text: 'Dies ist eine Test-E-Mail von der Relocato WebApp.'
        })
      });

      const result = await response.json();
      setSmtpResult(result);
    } catch (error: any) {
      setSmtpResult({
        success: false,
        error: error.message
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        IONOS E-Mail Test
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Teste die Verbindung zu IONOS E-Mail-Server
      </Typography>

      {/* IMAP Test */}
      <Card sx={{ mb: 3, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            IMAP Verbindung (E-Mails empfangen)
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Host: imap.ionos.de | Port: 993 | User: bielefeld@relocato.de
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={testIMAPConnection}
            disabled={testing}
            startIcon={testing ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            {testing ? 'Teste...' : 'IMAP Testen'}
          </Button>

          {imapResult && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={imapResult.success ? 'success' : 'error'}>
                {imapResult.success ? (
                  <>
                    <Typography>✅ IMAP Verbindung erfolgreich!</Typography>
                    {imapResult.totalMessages !== undefined && (
                      <Typography variant="body2">
                        Posteingang: {imapResult.totalMessages} E-Mails gesamt
                        {imapResult.unseen > 0 && ` (${imapResult.unseen} ungelesen)`}
                      </Typography>
                    )}
                    {emails.length > 0 && (
                      <Typography variant="body2">
                        {emails.length} E-Mails geladen
                      </Typography>
                    )}
                  </>
                ) : (
                  <>
                    <Typography>❌ IMAP Verbindung fehlgeschlagen</Typography>
                    <Typography variant="body2">{imapResult.error}</Typography>
                  </>
                )}
              </Alert>

              {emails.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Letzte 10 E-Mails:
                  </Typography>
                  <List dense>
                    {emails.slice(0, 10).map((email, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={email.subject}
                          secondary={
                            <>
                              Von: {email.from} | {email.date}
                              {email.hasAttachments && (
                                <Chip
                                  size="small"
                                  label="Anhänge"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* SMTP Test */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SendIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            SMTP Verbindung (E-Mails senden)
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Host: smtp.ionos.de | Port: 587 | User: bielefeld@relocato.de
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Test E-Mail Empfänger"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="bielefeld@relocato.de"
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            onClick={testSMTPConnection}
            disabled={sendingTest}
            startIcon={sendingTest ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {sendingTest ? 'Sende...' : 'SMTP Testen'}
          </Button>

          {smtpResult && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={smtpResult.success ? 'success' : 'error'}>
                {smtpResult.success ? (
                  <>
                    <Typography>✅ SMTP Verbindung erfolgreich!</Typography>
                    <Typography variant="body2">
                      E-Mail wurde gesendet an: {smtpResult.to}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography>❌ SMTP Verbindung fehlgeschlagen</Typography>
                    <Typography variant="body2">{smtpResult.error}</Typography>
                  </>
                )}
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Debug Informationen
          </Typography>
          <Button
            variant="outlined"
            onClick={async () => {
              const response = await fetch('/api/debug-ionos');
              const data = await response.json();
              setDebugInfo(data);
            }}
          >
            Debug Info laden
          </Button>
          {debugInfo && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {JSON.stringify(debugInfo, null, 2)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Connection Info */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Verbindungsinformationen
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="IMAP Server"
                secondary="imap.ionos.de:993 (SSL/TLS)"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="SMTP Server"
                secondary="smtp.ionos.de:587 (STARTTLS)"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Benutzername"
                secondary="bielefeld@relocato.de"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Passwort"
                secondary="Bicm1308"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmailTestIONOS;