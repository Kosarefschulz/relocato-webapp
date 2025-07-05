import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert, 
  Paper, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Card,
  CardContent,
  IconButton,
  Collapse
} from '@mui/material';
import { 
  Send as SendIcon, 
  Refresh as RefreshIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { supabase } from '../config/supabase';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
}

interface Email {
  uid: string;
  from: { name: string; address: string };
  to: { address: string }[];
  subject: string;
  date: string;
  flags: string[];
  body?: string;
  text?: string;
  html?: string;
}

const EmailTestComplete: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  
  // Email form state
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('Relocato Test E-Mail ' + new Date().toISOString());
  const [content, setContent] = useState('Dies ist eine automatische Test-E-Mail von der Relocato App.\n\nGesendet am: ' + new Date().toLocaleString('de-DE'));

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const runAllTests = async () => {
    setRunning(true);
    setTestResults([]);
    
    // Test 1: Send Email
    await testSendEmail();
    
    // Wait a bit for email to arrive
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: List Emails
    await testListEmails();
    
    // Test 3: Read Email
    if (emails.length > 0) {
      await testReadEmail(emails[0].uid);
    }
    
    setRunning(false);
  };

  const testSendEmail = async () => {
    try {
      const testEmail = to || 'bielefeld@relocato.de';
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject,
          content,
          html: `<div style="font-family: Arial, sans-serif;">
            <h2>${subject}</h2>
            <p>${content}</p>
            <hr />
            <p style="color: #666; font-size: 12px;">
              Diese E-Mail wurde über Supabase Edge Functions und IONOS SMTP gesendet.
            </p>
          </div>`
        }
      });

      if (error) throw error;

      addTestResult({
        test: 'E-Mail senden',
        success: true,
        message: `E-Mail erfolgreich an ${testEmail} gesendet`,
        details: data
      });
    } catch (error: any) {
      addTestResult({
        test: 'E-Mail senden',
        success: false,
        message: error.message,
        details: error
      });
    }
  };

  const testListEmails = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('email-list', {
        body: {
          folder: 'INBOX',
          page: 1,
          limit: 10
        }
      });

      if (error) throw error;

      setEmails(data.emails || []);
      
      addTestResult({
        test: 'E-Mails abrufen',
        success: true,
        message: `${data.emails?.length || 0} E-Mails gefunden`,
        details: {
          total: data.total,
          emails: data.emails?.length || 0,
          error: data.error
        }
      });
    } catch (error: any) {
      addTestResult({
        test: 'E-Mails abrufen',
        success: false,
        message: error.message,
        details: error
      });
    }
  };

  const testReadEmail = async (uid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('email-read', {
        body: {
          uid,
          folder: 'INBOX'
        }
      });

      if (error) throw error;

      setSelectedEmail(data.email);
      
      addTestResult({
        test: 'E-Mail lesen',
        success: true,
        message: `E-Mail "${data.email?.subject}" erfolgreich gelesen`,
        details: data.email
      });
    } catch (error: any) {
      addTestResult({
        test: 'E-Mail lesen',
        success: false,
        message: error.message,
        details: error
      });
    }
  };

  const refreshEmails = async () => {
    await testListEmails();
  };

  const toggleEmailExpand = (uid: string) => {
    if (expandedEmail === uid) {
      setExpandedEmail(null);
    } else {
      setExpandedEmail(uid);
      // Load email details
      testReadEmail(uid);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Vollständiger E-Mail Test
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Test Controls */}
        <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Test-E-Mail senden
            </Typography>
            
            <TextField
              fullWidth
              label="An (E-Mail-Adresse)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              margin="normal"
              placeholder="bielefeld@relocato.de"
              helperText="Leer lassen für Standard-Adresse"
            />
            
            <TextField
              fullWidth
              label="Betreff"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Inhalt"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              margin="normal"
              multiline
              rows={4}
            />
            
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={runAllTests}
                disabled={running}
                startIcon={running ? <CircularProgress size={20} /> : <SendIcon />}
                fullWidth
              >
                {running ? 'Tests laufen...' : 'Alle Tests durchführen'}
              </Button>
            </Box>
          </Paper>
        </Box>
        
        {/* Test Results */}
        <Box sx={{ flex: '1 1 45%', minWidth: '300px' }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Test-Ergebnisse
            </Typography>
            
            {testResults.length === 0 ? (
              <Typography color="text.secondary">
                Noch keine Tests durchgeführt
              </Typography>
            ) : (
              <List>
                {testResults.map((result, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {result.success ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                          <Typography>{result.test}</Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2">{result.message}</Typography>
                          {result.details && (
                            <Typography variant="caption" component="pre" sx={{ mt: 1 }}>
                              {JSON.stringify(result.details, null, 2)}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      </Box>
        
      {/* Email List */}
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              E-Mail Posteingang
            </Typography>
              <IconButton onClick={refreshEmails} disabled={running}>
                <RefreshIcon />
              </IconButton>
            </Box>
            
            {emails.length === 0 ? (
              <Typography color="text.secondary">
                Keine E-Mails gefunden
              </Typography>
            ) : (
              <List>
                {emails.map((email) => (
                  <React.Fragment key={email.uid}>
                    <ListItem 
                      onClick={() => toggleEmailExpand(email.uid)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon color="action" />
                            <Typography variant="subtitle1">{email.subject}</Typography>
                            {email.flags.includes('\\Seen') && (
                              <Chip label="Gelesen" size="small" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Von: {email.from.name || email.from.address}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(email.date).toLocaleString('de-DE')}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton>
                        {expandedEmail === email.uid ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </ListItem>
                    
                    <Collapse in={expandedEmail === email.uid}>
                      <Card sx={{ mx: 2, mb: 2 }}>
                        <CardContent>
                          {selectedEmail && selectedEmail.uid === email.uid ? (
                            <>
                              <Typography variant="body1" paragraph>
                                {selectedEmail.text || selectedEmail.body || 'Kein Inhalt'}
                              </Typography>
                              {selectedEmail.html && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                  Diese E-Mail enthält HTML-Inhalt
                                </Alert>
                              )}
                            </>
                          ) : (
                            <CircularProgress size={24} />
                          )}
                        </CardContent>
                      </Card>
                    </Collapse>
                    
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Status der E-Mail-Funktionalität:
        </Typography>
        <Typography variant="body2">
          • E-Mail-Versand: ✅ Implementiert über Supabase Edge Function mit IONOS SMTP
        </Typography>
        <Typography variant="body2">
          • E-Mail-Empfang: ✅ Implementiert über IMAP (imap.ionos.de:993)
        </Typography>
        <Typography variant="body2">
          • E-Mail-Lesen: ✅ Implementiert mit vollständigem Inhalt
        </Typography>
        <Typography variant="body2">
          • Weitere Aktionen: ⏳ In Entwicklung (Löschen, Verschieben, Als gelesen markieren)
        </Typography>
      </Alert>
    </Box>
  );
};

export default EmailTestComplete;