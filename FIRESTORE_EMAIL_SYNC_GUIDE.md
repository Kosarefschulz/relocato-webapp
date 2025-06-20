# Firestore Email Synchronization System

## Overview

This implementation creates a Firestore-based email synchronization system that completely avoids HTTP requests and CORS issues. Emails are synced from IONOS to Firestore in the background, and the frontend reads directly from Firestore with real-time updates.

## Key Benefits

1. **No CORS Issues**: All email data is read from Firestore, no direct HTTP calls needed
2. **Offline Support**: Firestore automatically caches data for offline access
3. **Real-time Updates**: New emails appear instantly when synced
4. **Better Performance**: No HTTP latency, data is served from cache
5. **Automatic Background Sync**: Emails sync every 5 minutes automatically

## Architecture

### Backend Components

1. **scheduledEmailSync.js**: Firebase Function that runs every 5 minutes
   - Connects to IONOS IMAP server
   - Fetches new emails from multiple folders
   - Stores emails in Firestore with proper structure
   - Tracks sync status and last synced UID

2. **Firestore Collections**:
   - `emailClient`: Stores all email data
   - `emailSyncStatus`: Tracks sync status per folder

### Frontend Components

1. **emailClientServiceFirestore.ts**: Service for reading emails from Firestore
   - Real-time subscriptions with `onSnapshot`
   - Offline-first with automatic caching
   - Search and filter capabilities
   - Email actions (mark as read, delete)

2. **EmailClientFirestore.tsx**: Updated UI component
   - Shows online/offline status
   - Real-time email updates
   - Works offline with cached data
   - Manual sync trigger option

## Setup Instructions

### 1. Deploy Firebase Functions

```bash
cd functions
npm install
firebase deploy --only functions:scheduledEmailSync,functions:triggerEmailSync,functions:cleanupOldEmails
```

### 2. Enable Cloud Scheduler

The scheduled function requires Cloud Scheduler to be enabled in your Firebase project:

1. Go to Firebase Console → Functions
2. You'll see a prompt to enable Cloud Scheduler if not already enabled
3. Click to enable (requires Blaze plan)

### 3. Update Frontend to Use Firestore

In your EmailClient component, you have two options:

**Option A: Use the new EmailClientFirestore component**
```tsx
import EmailClientFirestore from './components/EmailClientFirestore';

// In your App.tsx or wherever you use EmailClient
<EmailClientFirestore />
```

**Option B: Update existing service to use Firestore**
The `emailClientServiceV2.ts` already includes a switch:
```typescript
// Set to true to use Firestore, false for HTTP
const USE_FIRESTORE = true;
```

### 4. Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
// Email client rules
match /emailClient/{document} {
  allow read: if request.auth != null;
  allow write: if false; // Only functions can write
}

match /emailSyncStatus/{document} {
  allow read: if request.auth != null;
  allow write: if false; // Only functions can write
}
```

## How It Works

### Email Sync Flow

1. **Scheduled Sync (Every 5 minutes)**:
   - Function connects to IONOS IMAP
   - Checks each folder for new emails
   - Uses UID tracking to only fetch new emails
   - Stores emails in Firestore with composite key: `{folder}_{uid}`

2. **Frontend Real-time Updates**:
   - Component subscribes to Firestore collection
   - Receives instant updates when new emails are added
   - Shows cached data when offline
   - Automatically reconnects when online

3. **Manual Sync**:
   - Users can trigger immediate sync via UI
   - Calls `triggerEmailSync` function
   - Updates sync status in real-time

### Data Structure in Firestore

```javascript
// Document ID: INBOX_12345 (folder_uid)
{
  uid: 12345,
  folder: "INBOX",
  seqno: 100,
  flags: ["\\Seen", "\\Answered"],
  date: Timestamp,
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Email subject",
  messageId: "<unique-id@example.com>",
  preview: "First 200 characters...",
  textContent: "Full plain text content",
  htmlContent: "<html>Full HTML content</html>",
  attachments: [
    {
      filename: "document.pdf",
      contentType: "application/pdf",
      size: 102400,
      contentId: "cid:123"
    }
  ],
  syncedAt: ServerTimestamp,
  isRead: true,
  isFlagged: false,
  isDraft: false,
  isDeleted: false
}
```

## Monitoring and Debugging

### Check Sync Status

1. **In Firestore Console**:
   - Check `emailSyncStatus` collection
   - Look for `latest` document for overall status
   - Check `folder_INBOX`, `folder_Sent` etc. for per-folder status

2. **In Firebase Functions Logs**:
   - Monitor `scheduledEmailSync` execution
   - Check for any errors or sync issues

3. **In Frontend**:
   - Sync status indicator shows online/offline state
   - Last sync time displayed in UI
   - Manual sync button for testing

### Common Issues and Solutions

1. **Emails not syncing**:
   - Check Firebase Functions logs for errors
   - Verify IMAP credentials are correct
   - Check if Cloud Scheduler is enabled

2. **Offline not working**:
   - Ensure Firestore offline persistence is enabled
   - Check browser IndexedDB storage
   - Clear cache if corrupted

3. **Performance issues**:
   - Limit number of emails synced per folder
   - Use pagination in frontend
   - Enable old email cleanup function

## Costs and Limits

### Firebase Costs (Blaze Plan Required)

1. **Cloud Functions**:
   - Scheduled function: ~8,640 invocations/month (every 5 min)
   - Usually within free tier

2. **Firestore**:
   - Reads: Depends on email volume and active users
   - Writes: Number of new emails × folders
   - Storage: ~1KB per email

3. **Cloud Scheduler**:
   - 3 free jobs per month
   - $0.10 per additional job

### Recommended Limits

- Sync last 100 emails per folder
- Clean up emails older than 90 days
- Limit attachment size tracking

## Migration from HTTP-based System

1. **Deploy new functions** first
2. **Wait for initial sync** to complete (check Firestore)
3. **Switch frontend** to use Firestore service
4. **Test offline functionality**
5. **Remove old HTTP endpoints** (optional)

## Future Enhancements

1. **Push Notifications**: Notify users of new emails
2. **Full-text Search**: Use Firestore composite indexes
3. **Attachment Storage**: Store attachments in Cloud Storage
4. **Email Threading**: Group related emails
5. **Labels and Filters**: Custom email organization

## Troubleshooting Commands

```bash
# Check function logs
firebase functions:log --only scheduledEmailSync

# Manually trigger sync
curl https://europe-west1-umzugsapp.cloudfunctions.net/triggerEmailSync

# Check specific folder
curl https://europe-west1-umzugsapp.cloudfunctions.net/triggerEmailSync?folder=Sent

# Clear all emails (careful!)
# Use Firestore console to delete emailClient collection
```