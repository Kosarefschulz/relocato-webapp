import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';

const EmailDebugger: React.FC = () => {
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState<any>({
    user: null,
    userDoc: null,
    errors: [],
    checks: []
  });

  useEffect(() => {
    runDebugChecks();
  }, []);

  const runDebugChecks = async () => {
    const info: {
      user: any;
      userDoc: any;
      errors: string[];
      checks: string[];
    } = {
      user: null,
      userDoc: null,
      errors: [],
      checks: []
    };

    // Check 1: Auth user
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        info.user = {
          uid: user.id,
          email: user.email,
          displayName: user.email
        };
        info.checks.push('✅ User is authenticated');
      } else {
        info.errors.push('❌ No authenticated user');
      }
    } catch (error: any) {
      info.errors.push(`❌ Auth error: ${error.message}`);
    }

    // Check 2: User document in Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const { data: userDoc, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && userDoc) {
          info.userDoc = userDoc;
          info.checks.push('✅ User document exists');
          
          if (info.userDoc.email_access) {
            info.checks.push('✅ User has email access');
          } else {
            info.errors.push('❌ User does not have email access');
          }
        } else {
          info.errors.push('❌ User document does not exist');
        }
      } catch (error: any) {
        info.errors.push(`❌ Supabase error: ${error.message}`);
      }
    }

    // Check 3: Supabase configuration
    try {
      if (supabase) {
        info.checks.push('✅ Supabase is initialized');
      } else {
        info.errors.push('❌ Supabase is not initialized');
      }
    } catch (error: any) {
      info.errors.push(`❌ Supabase config error: ${error.message}`);
    }

    // Check 4: Console errors
    const originalError = console.error;
    console.error = function(...args) {
      info.errors.push(`Console error: ${args.join(' ')}`);
      originalError.apply(console, args);
    };

    setDebugInfo(info);

    // Restore console.error after 5 seconds
    setTimeout(() => {
      console.error = originalError;
    }, 5000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Email Client Debug Information
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Authentication Status:</Typography>
          {debugInfo.user ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              Logged in as: {debugInfo.user.email} (UID: {debugInfo.user.uid})
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mt: 1 }}>
              Not authenticated
            </Alert>
          )}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">User Document:</Typography>
          {debugInfo.userDoc ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              <pre>{JSON.stringify(debugInfo.userDoc, null, 2)}</pre>
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mt: 1 }}>
              No user document found
            </Alert>
          )}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Successful Checks:</Typography>
          {debugInfo.checks.map((check: string, index: number) => (
            <Alert key={index} severity="success" sx={{ mt: 1 }}>
              {check}
            </Alert>
          ))}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Errors:</Typography>
          {debugInfo.errors.length > 0 ? (
            debugInfo.errors.map((error: string, index: number) => (
              <Alert key={index} severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            ))
          ) : (
            <Alert severity="success" sx={{ mt: 1 }}>
              No errors detected
            </Alert>
          )}
        </Box>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/email')}
          >
            Try Email Client
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
          <Button 
            variant="outlined" 
            onClick={runDebugChecks}
          >
            Re-run Checks
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmailDebugger;