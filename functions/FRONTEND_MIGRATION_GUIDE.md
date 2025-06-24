# Frontend Migration Guide - Email Backend to Firebase Functions

## Overview
This guide helps you migrate from using the backend server endpoints to Firebase Cloud Functions for email functionality.

## Endpoint Mapping

### Old Backend Endpoints → New Firebase Functions

| Old Endpoint | New Firebase Function | Changes |
|--------------|----------------------|---------|
| `POST /api/email/list` | `POST /listEmails` | Same request/response format |
| `POST /api/email/read` | `POST /readEmail` | Same request/response format |
| `POST /api/email/folders` | `POST /getEmailFolders` | Same request/response format |
| `POST /api/send-email` | `POST /sendEmail` | Same request/response format |
| `GET /api/health` | `GET /emailHealthCheck` | Response includes timestamp |

## Frontend Service Updates

### 1. Update Base URL Configuration

Create or update your API configuration:

```javascript
// src/config/api.js
const isDevelopment = process.env.NODE_ENV === 'development';

export const API_ENDPOINTS = {
  // Firebase Functions base URL
  FIREBASE_FUNCTIONS: isDevelopment 
    ? 'http://localhost:5001/umzugsapp/us-central1'
    : 'https://europe-west1-umzugsapp.cloudfunctions.net',
    
  // Email endpoints
  EMAIL: {
    LIST: '/listEmails',
    READ: '/readEmail',
    FOLDERS: '/getEmailFolders',
    SEND: '/sendEmail',
    HEALTH: '/emailHealthCheck'
  }
};
```

### 2. Update Email Service

```javascript
// src/services/emailService.js
import { API_ENDPOINTS } from '../config/api';

class EmailService {
  async listEmails(folder = 'INBOX', page = 1, limit = 50) {
    try {
      const response = await fetch(`${API_ENDPOINTS.FIREBASE_FUNCTIONS}${API_ENDPOINTS.EMAIL.LIST}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folder, page, limit })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error listing emails:', error);
      throw error;
    }
  }
  
  async readEmail(uid, folder = 'INBOX') {
    try {
      const response = await fetch(`${API_ENDPOINTS.FIREBASE_FUNCTIONS}${API_ENDPOINTS.EMAIL.READ}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, folder })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error reading email:', error);
      throw error;
    }
  }
  
  async getEmailFolders() {
    try {
      const response = await fetch(`${API_ENDPOINTS.FIREBASE_FUNCTIONS}${API_ENDPOINTS.EMAIL.FOLDERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting folders:', error);
      throw error;
    }
  }
  
  async sendEmail(emailData) {
    try {
      const response = await fetch(`${API_ENDPOINTS.FIREBASE_FUNCTIONS}${API_ENDPOINTS.EMAIL.SEND}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
  
  async checkHealth() {
    try {
      const response = await fetch(`${API_ENDPOINTS.FIREBASE_FUNCTIONS}${API_ENDPOINTS.EMAIL.HEALTH}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking email service health:', error);
      throw error;
    }
  }
}

export default new EmailService();
```

### 3. Update Components Using Email Service

Example component update:

```javascript
// Before
const response = await fetch(`${process.env.REACT_APP_API_URL}/api/email/list`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ folder: 'INBOX', page: 1, limit: 50 })
});

// After
import emailService from '../services/emailService';

const response = await emailService.listEmails('INBOX', 1, 50);
```

## Environment Variables

Remove old backend URL environment variables and optionally add Firebase project configuration:

```bash
# .env.development
REACT_APP_FIREBASE_PROJECT_ID=umzugsapp
REACT_APP_FIREBASE_REGION=europe-west1

# .env.production
REACT_APP_FIREBASE_PROJECT_ID=umzugsapp
REACT_APP_FIREBASE_REGION=europe-west1
```

## Testing the Migration

1. **Test locally with Firebase Emulator:**
   ```bash
   # In functions directory
   firebase emulators:start --only functions
   
   # Your frontend will connect to http://localhost:5001
   ```

2. **Test each endpoint:**
   - List emails in different folders
   - Read individual emails
   - Send test emails
   - Check email service health

3. **Monitor for errors:**
   - Check browser console for CORS or network errors
   - Check Firebase Functions logs for server-side errors

## Gradual Migration Strategy

If you want to migrate gradually:

1. **Create a feature flag:**
   ```javascript
   const USE_FIREBASE_FUNCTIONS = process.env.REACT_APP_USE_FIREBASE_FUNCTIONS === 'true';
   ```

2. **Update email service to support both:**
   ```javascript
   async listEmails(folder = 'INBOX', page = 1, limit = 50) {
     const url = USE_FIREBASE_FUNCTIONS
       ? `${API_ENDPOINTS.FIREBASE_FUNCTIONS}${API_ENDPOINTS.EMAIL.LIST}`
       : `${process.env.REACT_APP_API_URL}/api/email/list`;
     
     // ... rest of the implementation
   }
   ```

## Benefits of Migration

1. **Serverless**: No need to manage backend server infrastructure
2. **Auto-scaling**: Firebase Functions scale automatically
3. **Integrated**: Works seamlessly with other Firebase services
4. **Cost-effective**: Pay only for what you use
5. **Global CDN**: Functions can be deployed to multiple regions

## Rollback Plan

If you need to rollback:

1. Change the API endpoints back to the backend server URLs
2. Ensure the backend server is running
3. Update environment variables

## Common Issues and Solutions

1. **CORS Errors**: The Firebase Functions are configured to accept all origins. If you still get CORS errors, check if you're sending the correct headers.

2. **Authentication**: If you're using Firebase Authentication, you may need to add the auth token to your requests:
   ```javascript
   const user = firebase.auth().currentUser;
   const token = await user.getIdToken();
   
   headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`
   }
   ```

3. **Rate Limiting**: Firebase Functions have quotas. Monitor your usage in the Firebase Console.

4. **Cold Starts**: First requests might be slower due to cold starts. Consider keeping functions warm if needed.