# Automatic Email Import System - Deployment Guide

## Overview

The automatic email import system periodically checks the IONOS email account for new customer inquiries and automatically creates customer records and quotes in the system.

## Features

1. **Scheduled Import**: Runs every 2 hours between 6:00 and 22:00 (configurable)
2. **Duplicate Detection**: Prevents importing the same customer multiple times
3. **Smart Parsing**: Extracts customer data from various email formats
4. **Welcome Emails**: Automatically sends welcome emails to new customers
5. **Quote Generation**: Creates draft quotes based on extracted information
6. **Import History**: Tracks all imports with detailed statistics
7. **Error Logging**: Logs failed imports for manual review
8. **Notifications**: Sends notifications about import results

## Components

### 1. Cloud Functions

#### `scheduledCustomerImport`
- **Location**: `/functions/automaticEmailImporter.js`
- **Schedule**: Every 2 hours (configurable)
- **Purpose**: Main scheduled function that runs the import

#### `triggerCustomerImport`
- **Location**: `/functions/automaticEmailImporter.js`
- **Type**: HTTPS trigger
- **Purpose**: Manual trigger for immediate import

### 2. Frontend Components

#### `EmailImportMonitor`
- **Location**: `/src/components/EmailImportMonitor.tsx`
- **Purpose**: Dashboard for monitoring import status and history

#### `EmailImportSettings`
- **Location**: `/src/components/EmailImportSettings.tsx`
- **Purpose**: Configure import settings (schedule, sources, behavior)

#### `EmailImportLogs`
- **Location**: `/src/components/EmailImportLogs.tsx`
- **Purpose**: View and manage failed imports

## Deployment Steps

### 1. Deploy Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions:scheduledCustomerImport,functions:triggerCustomerImport
```

### 2. Configure Firestore Security Rules

Add these rules to allow the system to read/write necessary collections:

```javascript
// In firestore.rules
match /system/{document} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.token.admin == true;
}

match /import_history/{document} {
  allow read: if request.auth != null;
  allow write: if false; // Only functions can write
}

match /failed_imports/{document} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.token.admin == true;
}

match /notifications/{document} {
  allow read: if request.auth != null;
  allow write: if false; // Only functions can write
}
```

### 3. Initial Configuration

1. Navigate to the Email Import Settings in the admin panel
2. Configure:
   - Import interval (default: 2 hours)
   - Business hours (default: 6:00 - 22:00)
   - Email sources (default: immoscout24, umzug365)
   - Auto-send welcome emails (default: enabled)
   - Auto-create quotes (default: enabled)

### 4. Add Frontend Routes

Add these routes to your main app router:

```typescript
// In your routing configuration
import EmailImportMonitor from './components/EmailImportMonitor';
import EmailImportSettings from './components/EmailImportSettings';
import EmailImportLogs from './components/EmailImportLogs';

// Add routes
<Route path="/admin/email-import" element={<EmailImportMonitor />} />
<Route path="/admin/email-import/settings" element={<EmailImportSettings />} />
<Route path="/admin/email-import/logs" element={<EmailImportLogs />} />
```

## Usage

### Manual Import

1. Go to Email Import Monitor
2. Click "Manueller Import" button
3. Wait for import to complete
4. Check results in the statistics

### Monitoring

1. **Import Status**: Shows last import time and next scheduled import
2. **Statistics**: Displays new customers, duplicates, errors
3. **History**: View past imports with detailed metrics
4. **Notifications**: Real-time updates on import results

### Troubleshooting Failed Imports

1. Go to Email Import Logs
2. Review failed imports by category:
   - **No Name**: Customer name couldn't be extracted
   - **Parse Error**: Email format couldn't be parsed
   - **Other**: Various other errors
3. Click on any entry to view full details
4. Manually create customer if needed

## Email Sources

The system currently imports from:
- ImmobilienScout24 / ImmoScout24
- Umzug365 / Umzug-365

To add new sources:
1. Go to Email Import Settings
2. Click "Quelle hinzufügen"
3. Enter the domain/keyword to match
4. Save settings

## Schedule Configuration

Default schedule:
- **Interval**: Every 2 hours
- **Business Hours**: 6:00 - 22:00
- **Time Zone**: Europe/Berlin

The schedule uses cron syntax in Cloud Scheduler:
- `0 */2 * * *` = Every 2 hours at minute 0
- Business hours check is done in the function itself

## Security Considerations

1. **Email Credentials**: Stored securely in Cloud Functions environment
2. **Access Control**: Only authenticated admin users can trigger manual imports
3. **Rate Limiting**: Automatic imports are limited by schedule
4. **Duplicate Prevention**: Multiple checks prevent duplicate customer creation

## Monitoring & Alerts

### Metrics to Monitor
- Number of new customers per day
- Failed import rate
- Average processing time
- Email source distribution

### Alerts
- Failed imports > 10% of total
- No imports for > 4 hours during business hours
- Import duration > 5 minutes

## Maintenance

### Regular Tasks
1. Review failed imports weekly
2. Clean up old import history (> 30 days)
3. Monitor email source patterns
4. Update parsing rules as needed

### Database Cleanup
```javascript
// Clean up old import history
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const oldImports = await db.collection('import_history')
  .where('timestamp', '<', thirtyDaysAgo)
  .get();

const batch = db.batch();
oldImports.forEach(doc => batch.delete(doc.ref));
await batch.commit();
```

## Testing

### Test Manual Import
```bash
curl -X POST https://europe-west1-umzugsapp.cloudfunctions.net/triggerCustomerImport
```

### Test Scheduled Function Locally
```bash
cd functions
npm run shell
> scheduledCustomerImport({})
```

## Troubleshooting

### Common Issues

1. **No emails imported**
   - Check IMAP credentials
   - Verify email sources in settings
   - Check if emails match search criteria

2. **High duplicate rate**
   - Review duplicate detection logic
   - Check if customers have multiple email addresses

3. **Parse errors**
   - Review email format changes
   - Update parsing patterns in emailParser.js

4. **Function timeout**
   - Reduce batch size
   - Optimize email processing

### Logs

View function logs:
```bash
firebase functions:log --only scheduledCustomerImport
```

View specific errors:
```bash
firebase functions:log --only scheduledCustomerImport --severity ERROR
```

## Future Enhancements

1. **Machine Learning**: Improve parsing accuracy with ML
2. **Multi-language**: Support for non-German emails
3. **Custom Rules**: User-defined parsing rules
4. **Webhooks**: Real-time import via email webhooks
5. **Advanced Filtering**: More sophisticated duplicate detection
6. **Email Templates**: Customizable welcome emails
7. **Import Approval**: Review queue before creating customers