/**
 * Platform Configuration
 * Controls which backend platform to use (Firebase or Vercel)
 */

// Set this to control which platform to use
export const USE_VERCEL = process.env.REACT_APP_USE_VERCEL === 'true' || false;

// Import services conditionally
export async function getPlatformServices() {
  if (USE_VERCEL) {
    const { databaseServiceVercel } = await import('../services/databaseServiceVercel');
    const { authServiceVercel } = await import('../services/authServiceVercel');
    const { emailService } = await import('../services/emailServiceVercel');
    
    return {
      databaseService: databaseServiceVercel,
      authService: authServiceVercel,
      emailService: emailService,
      platform: 'vercel' as const,
    };
  } else {
    const { unifiedDatabaseService } = await import('../services/unifiedDatabaseService.optimized');
    const { authService } = await import('../services/authService');
    const { sendEmail } = await import('../services/emailService');
    
    return {
      databaseService: unifiedDatabaseService,
      authService,
      emailService: { sendEmail }, // Wrap in object to match expected interface
      platform: 'firebase' as const,
    };
  }
}

// Export platform check
export const isVercelPlatform = () => USE_VERCEL;
export const isFirebasePlatform = () => !USE_VERCEL;

// Platform-specific configurations
export const platformConfig = {
  vercel: {
    apiUrl: process.env.REACT_APP_API_URL || '/api',
    authRedirectUrl: process.env.REACT_APP_AUTH_REDIRECT_URL || window.location.origin,
  },
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  },
};

// Get current platform config
export const getCurrentPlatformConfig = () => {
  return USE_VERCEL ? platformConfig.vercel : platformConfig.firebase;
};