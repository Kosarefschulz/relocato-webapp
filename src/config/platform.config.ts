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
    const { unifiedDatabaseService } = await import('../services/unifiedDatabaseService');
    const { authService } = await import('../services/authService');
    const { sendEmail } = await import('../services/emailService');
    
    return {
      databaseService: unifiedDatabaseService,
      authService,
      emailService: { sendEmail }, // Wrap in object to match expected interface
      platform: 'supabase' as const,
    };
  }
}

// Export platform check
export const isVercelPlatform = () => USE_VERCEL;
export const isFirebasePlatform = () => false; // Firebase is no longer supported

// Platform-specific configurations
export const platformConfig = {
  vercel: {
    apiUrl: process.env.REACT_APP_API_URL || '/api',
    authRedirectUrl: process.env.REACT_APP_AUTH_REDIRECT_URL || window.location.origin,
  },
  // Firebase config removed - no longer supported
  supabase: {
    url: process.env.REACT_APP_SUPABASE_URL,
    anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
  },
};

// Get current platform config
export const getCurrentPlatformConfig = () => {
  return USE_VERCEL ? platformConfig.vercel : platformConfig.supabase;
};