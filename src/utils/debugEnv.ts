// Debug utility to check environment variables
export const debugEnvironmentVariables = () => {
  console.log('=== Environment Variables Debug ===');
  console.log('Firebase Config:', {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '✅ SET' : '❌ MISSING',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '❌ MISSING',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '❌ MISSING',
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '❌ MISSING',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '❌ MISSING',
    appId: process.env.REACT_APP_FIREBASE_APP_ID ? '✅ SET' : '❌ MISSING',
  });
  
  console.log('Google Sheets Config:', {
    spreadsheetId: process.env.REACT_APP_GOOGLE_SHEETS_ID || '❌ MISSING',
    apiKey: process.env.REACT_APP_GOOGLE_SHEETS_API_KEY ? '✅ SET' : '❌ MISSING',
  });
  
  console.log('OpenAI Config:', {
    apiKey: process.env.REACT_APP_OPENAI_API_KEY ? '✅ SET' : '❌ MISSING',
  });
  
  console.log('SMTP Config:', {
    from: process.env.REACT_APP_SMTP_FROM || '❌ MISSING',
  });
  
  console.log('API URL:', process.env.REACT_APP_API_URL || '❌ MISSING');
  
  // Return summary
  const missing = [];
  if (!process.env.REACT_APP_GOOGLE_SHEETS_API_KEY) missing.push('GOOGLE_SHEETS_API_KEY');
  if (!process.env.REACT_APP_GOOGLE_SHEETS_ID) missing.push('GOOGLE_SHEETS_ID');
  if (!process.env.REACT_APP_OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
  
  if (missing.length > 0) {
    console.error('❌ Missing critical environment variables:', missing);
    console.error('Please set these in Vercel Dashboard → Settings → Environment Variables');
  } else {
    console.log('✅ All critical environment variables are set!');
  }
  
  return {
    hasCriticalVars: missing.length === 0,
    missing
  };
};

// Auto-run in development
if (process.env.NODE_ENV === 'development') {
  debugEnvironmentVariables();
}

// Make it available globally
(window as any).debugEnv = debugEnvironmentVariables;