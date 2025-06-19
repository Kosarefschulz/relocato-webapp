import React, { useState, useEffect } from 'react';
import { Paper, Typography, Chip, Button, LinearProgress, Alert } from '@mui/material';
import { CheckCircle, Error, Warning, Refresh } from '@mui/icons-material';

const EmailStatusMonitor: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      // Check environment
      const envResponse = await fetch('/api/test-email-simple?check=env');
      const envData = await envResponse.json();
      
      // Check SMTP
      const smtpResponse = await fetch('/api/test-email-simple?action=test-smtp');
      const smtpData = await smtpResponse.json();
      
      setStatus({
        environment: envData,
        smtp: smtpData,
        overall: envData.hasCredentials && smtpData.success
      });
      setLastCheck(new Date());
    } catch (error) {
      console.error('Status check failed:', error);
      setStatus({
        overall: false,
        error: 'Status check failed'
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  if (!status) return <LinearProgress />;

  return (
    <Paper sx={{ p: 2, position: 'fixed', bottom: 20, right: 20, zIndex: 1000, minWidth: 300 }}>
      <Typography variant="subtitle2" gutterBottom>
        Email System Status
      </Typography>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Chip
          icon={status.overall ? <CheckCircle /> : <Error />}
          label={status.overall ? 'Operational' : 'Issues Detected'}
          color={status.overall ? 'success' : 'error'}
          size="small"
        />
        <Button size="small" onClick={checkStatus} disabled={loading}>
          <Refresh fontSize="small" />
        </Button>
      </div>

      {status.error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {status.error}
        </Alert>
      )}

      {status.environment && (
        <Typography variant="caption" color="text.secondary">
          Credentials: {status.environment.hasCredentials ? '✓' : '✗'} | 
          SMTP: {status.smtp?.success ? '✓' : '✗'}
        </Typography>
      )}

      {lastCheck && (
        <Typography variant="caption" display="block" color="text.secondary" mt={1}>
          Last check: {lastCheck.toLocaleTimeString()}
        </Typography>
      )}
    </Paper>
  );
};

export default EmailStatusMonitor;