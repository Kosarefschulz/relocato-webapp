import React, { useState } from 'react';
import { Box, Paper, Typography, Button, TextField, Alert, CircularProgress, Divider } from '@mui/material';
import { ionosEmailService as emailService } from '../services/emailServiceIONOS';
import { supabase } from '../config/supabase';

const EmailDebugTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState('test@relocato.de');

  const addResult = (test: string, success: boolean, message: string, details?: any) => {
    setResults(prev => [...prev, {
      test,
      success,
      message,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);

    // Test 1: Check Supabase Connection
    try {
      const { data, error } = await supabase.from('customers').select('count').limit(1);
      if (error) throw error;
      addResult('Supabase Connection', true, 'Connected to Supabase successfully');
    } catch (error: any) {
      addResult('Supabase Connection', false, 'Failed to connect to Supabase', error.message);
    }

    // Test 2: Get Email Folders
    try {
      const folders = await emailService.getFolders();
      addResult('Get Email Folders', true, `Found ${folders.length} folders`, folders);
    } catch (error: any) {
      addResult('Get Email Folders', false, 'Failed to get folders', error.message);
    }

    // Test 3: Get Emails from INBOX
    try {
      const { emails, total } = await emailService.getEmails('INBOX', 1, 10);
      addResult('Get Emails', true, `Found ${emails.length} emails (Total: ${total})`, 
        emails.slice(0, 3).map(e => ({ subject: e.subject, from: e.from, date: e.date }))
      );
    } catch (error: any) {
      addResult('Get Emails', false, 'Failed to get emails', error.message);
    }

    // Test 4: Send Test Email
    try {
      const result = await emailService.sendEmail(
        testEmail,
        `Test Email - ${new Date().toISOString()}`,
        'This is a test email from EmailDebugTest'
      );
      addResult('Send Email', result, result ? 'Email sent successfully' : 'Failed to send email');
    } catch (error: any) {
      addResult('Send Email', false, 'Failed to send email', error.message);
    }

    // Test 5: Check Email Database
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('count')
        .limit(1);
      
      if (error && error.code === '42P01') {
        addResult('Email Database', false, 'Email table does not exist yet', 'Run migrations');
      } else if (error) {
        throw error;
      } else {
        addResult('Email Database', true, 'Email database table exists');
      }
    } catch (error: any) {
      addResult('Email Database', false, 'Failed to check email database', error.message);
    }

    // Test 6: Check Email Customer Links
    try {
      const { data, error } = await supabase
        .from('email_customer_links')
        .select('count')
        .limit(1);
      
      if (error && error.code === '42P01') {
        addResult('Email Customer Links', false, 'Email customer links table does not exist yet', 'Run migrations');
      } else if (error) {
        throw error;
      } else {
        addResult('Email Customer Links', true, 'Email customer links table exists');
      }
    } catch (error: any) {
      addResult('Email Customer Links', false, 'Failed to check email customer links', error.message);
    }

    setLoading(false);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Email System Debug Test
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Test Email Address"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          
          <Button 
            variant="contained" 
            onClick={runTests}
            disabled={loading}
            size="large"
          >
            {loading ? <CircularProgress size={24} /> : 'Run All Tests'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {results.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Test Results:
            </Typography>
            
            {results.map((result, index) => (
              <Alert 
                key={index} 
                severity={result.success ? 'success' : 'error'}
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {result.test}
                </Typography>
                <Typography variant="body2">
                  {result.message}
                </Typography>
                {result.details && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <pre style={{ margin: 0, fontSize: '0.8rem', overflow: 'auto' }}>
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </Box>
                )}
              </Alert>
            ))}
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2">Summary:</Typography>
              <Typography color="success.main">
                Passed: {results.filter(r => r.success).length}
              </Typography>
              <Typography color="error.main">
                Failed: {results.filter(r => !r.success).length}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default EmailDebugTest;