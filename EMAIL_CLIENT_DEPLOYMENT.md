# Email Client Firebase Deployment Guide

## Overview
This guide explains how to deploy the professional email client to Firebase/production. The email client uses Firebase Functions for backend operations since Firebase doesn't support WebSocket connections.

## Architecture Changes for Firebase

### Backend Architecture
- **Local Development**: Uses Node.js + Express + Socket.io for real-time updates
- **Production (Firebase)**: Uses Firebase Functions + Firestore for near real-time updates

### Key Differences
1. **No WebSocket**: Firebase Functions don't support persistent connections
2. **Polling/Firestore**: Uses Firestore listeners for real-time updates
3. **Function Timeouts**: IMAP operations must complete within function timeout limits
4. **Region**: All functions deployed to `europe-west3`

## Firebase Functions Created

### Email Operations
- `getEmailFolders` - Get all email folders from IMAP
- `getEmails` - List emails with pagination and search
- `getEmail` - Get single email with full content
- `sendEmail` - Send email via SMTP
- `deleteEmail` - Delete email from IMAP
- `moveEmail` - Move email between folders
- `markAsRead` - Mark email as read
- `markAsUnread` - Mark email as unread
- `searchEmails` - Search emails across folders
- `syncEmailsPeriodically` - Scheduled function (runs every 15 minutes)
- `triggerEmailSync` - Manual sync trigger

## Deployment Steps

### 1. Prerequisites
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Select project
firebase use umzugsapp
```

### 2. Environment Setup
```bash
# Set email configuration
firebase functions:config:set email.user="bielefeld@relocato.de" email.pass="Bicm1308"
```

### 3. Deploy Functions
```bash
# Deploy all email functions
firebase deploy --only functions:getEmailFolders,functions:getEmails,functions:getEmail,functions:sendEmail,functions:deleteEmail,functions:moveEmail,functions:markAsRead,functions:markAsUnread,functions:searchEmails,functions:syncEmailsPeriodically,functions:triggerEmailSync
```

### 4. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 5. Build and Deploy Frontend
```bash
# Set environment variable
export REACT_APP_USE_FIREBASE=true

# Build the app
npm run build

# Deploy to hosting
firebase deploy --only hosting
```

### 6. Grant Email Access to Users
```bash
cd functions
node grantEmailAccess.js user@example.com
```

## Quick Deployment Script
```bash
# Run the deployment script
./deploy-email-client.sh
```

## User Setup

### Grant Email Access
Users need the `emailAccess` field set to `true` in their Firestore user document:

```javascript
// In Firestore console or via Admin SDK
{
  email: "user@example.com",
  emailAccess: true,
  role: "admin" // optional
}
```

### Via Script
```bash
cd functions
node grantEmailAccess.js user@example.com
```

## Testing

### 1. Access the App
- Production: https://umzugsapp.firebaseapp.com
- Login with a user that has `emailAccess: true`

### 2. Test Email Functions
- Navigate to the Email Client section
- Test folder listing
- Test email viewing
- Test sending emails
- Test search functionality

### 3. Monitor Functions
```bash
# View function logs
firebase functions:log

# View specific function logs
firebase functions:log --only getEmails
```

## Firestore Collections

### emailClient
Stores synced emails for quick access:
```javascript
{
  messageId: "...",
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Email subject",
  date: Timestamp,
  folder: "INBOX",
  flags: ["\\Seen"],
  userId: "user-uid",
  syncedAt: Timestamp
}
```

### emailHistory
Stores sent email history:
```javascript
{
  messageId: "...",
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Email subject",
  sentAt: Timestamp,
  userId: "user-uid",
  status: "sent"
}
```

### emailFolders
Cached folder structure:
```javascript
{
  name: "INBOX",
  path: "INBOX",
  attributes: [],
  hasChildren: false,
  userId: "user-uid"
}
```

## Troubleshooting

### Function Timeouts
If you see timeout errors:
1. Increase function timeout in `runWith({ timeoutSeconds: 300 })`
2. Reduce email fetch limit
3. Optimize IMAP queries

### Authentication Errors
1. Check user has `emailAccess: true`
2. Verify Firebase Auth is working
3. Check function logs for specific errors

### IMAP Connection Issues
1. Verify email credentials in functions config
2. Check IONOS server settings
3. Review function logs for connection errors

### Real-time Updates Not Working
1. Check Firestore rules allow read access
2. Verify user authentication
3. Check browser console for listener errors

## Monitoring & Maintenance

### Scheduled Sync
The `syncEmailsPeriodically` function runs every 15 minutes to sync:
- Last 100 emails from INBOX
- Last 50 emails from Sent folder

### Manual Sync
Users can trigger manual sync via the UI, which calls `triggerEmailSync`

### Performance Optimization
1. Use Firestore for frequently accessed emails
2. Fetch from IMAP only when needed
3. Implement proper pagination
4. Cache folder structure

## Security Considerations

1. **Authentication**: All functions require Firebase Auth
2. **Email Access**: Users need explicit `emailAccess` permission
3. **Data Isolation**: Users can only see their own synced emails
4. **Firestore Rules**: Strict rules prevent unauthorized access
5. **Credentials**: Email credentials stored in Firebase Functions config

## Cost Considerations

### Firebase Functions
- Invocations: Email operations trigger function calls
- Compute time: IMAP operations can take several seconds
- Outbound networking: IMAP/SMTP connections

### Firestore
- Document reads: Email listing and real-time listeners
- Document writes: Email sync and updates
- Storage: Cached email metadata

### Recommendations
1. Implement efficient pagination
2. Cache frequently accessed data
3. Limit sync frequency
4. Monitor usage in Firebase Console

## Future Improvements

1. **Push Notifications**: Notify users of new emails
2. **Attachment Handling**: Store attachments in Firebase Storage
3. **Advanced Search**: Full-text search with Algolia
4. **Offline Support**: Better offline functionality
5. **Email Templates**: Store and manage email templates
6. **Bulk Operations**: Select and operate on multiple emails
7. **Labels/Tags**: Custom email organization
8. **Filters/Rules**: Automatic email processing