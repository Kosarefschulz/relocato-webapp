// API Configuration
export const API_CONFIG = {
  // Backend URL - Update this when you deploy to Vercel
  // Local: http://localhost:3001
  // Production: https://relocato-email-backend.vercel.app (or your actual Vercel URL)
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001',
  
  // API Endpoints
  endpoints: {
    // Email endpoints
    sendEmail: '/api/send-email',
    listEmails: '/api/email/list',
    readEmail: '/api/email/read',
    emailFolders: '/api/email/folders',
    
    // Google Drive endpoints
    driveAuth: '/api/google/auth-url',
    driveCallback: '/api/google/callback',
    driveUpload: '/api/drive/upload',
    driveList: '/api/drive/list',
    
    // PDF generation
    generateInvoice: '/api/generate-invoice',
    generateOffer: '/api/generate-offer',
    
    // Test endpoints
    test: '/test',
    testSMTP: '/api/test-smtp',
    testIMAP: '/test-imap'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BACKEND_URL}${API_CONFIG.endpoints[endpoint] || endpoint}`;
};