import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper } from '@mui/material';
import { supabase } from '../config/supabase';

const EmailTestPage: React.FC = () => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('Test E-Mail');
  const [content, setContent] = useState('Dies ist eine Test-E-Mail von der Relocato App.');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const sendTestEmail = async () => {
    setSending(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          content
        }
      });

      if (error) throw error;

      setResult({
        success: true,
        message: 'E-Mail erfolgreich gesendet!'
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: `Fehler: ${error.message}`
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        E-Mail Test
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <TextField
          fullWidth
          label="An (E-Mail-Adresse)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          margin="normal"
          type="email"
          required
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
        
        <Button
          variant="contained"
          color="primary"
          onClick={sendTestEmail}
          disabled={!to || sending}
          sx={{ mt: 2 }}
          fullWidth
        >
          {sending ? 'Sende...' : 'Test E-Mail senden'}
        </Button>
        
        {result && (
          <Alert severity={result.success ? 'success' : 'error'} sx={{ mt: 2 }}>
            {result.message}
          </Alert>
        )}
      </Paper>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Diese Seite testet die E-Mail-Funktionalität über Supabase Edge Functions und IONOS SMTP.
      </Typography>
    </Box>
  );
};

export default EmailTestPage;