# Firebase Email Backend Configuration Guide

## Overview
The email backend functionality has been integrated into Firebase Cloud Functions. This includes IMAP email reading, SMTP email sending, and folder management.

## Firebase Functions Created

1. **listEmails** - Lists emails from IMAP server with pagination
   - Endpoint: `/listEmails`
   - Method: POST
   - Body: `{ folder: "INBOX", page: 1, limit: 50 }`

2. **readEmail** - Reads a specific email by UID
   - Endpoint: `/readEmail`
   - Method: POST
   - Body: `{ uid: "123", folder: "INBOX" }`

3. **getEmailFolders** - Gets all available email folders
   - Endpoint: `/getEmailFolders`
   - Method: POST
   - Body: `{}`

4. **sendEmail** - Sends email via SMTP
   - Endpoint: `/sendEmail`
   - Method: POST
   - Body: `{ to: "email@example.com", subject: "Subject", content: "Content", attachments: [], bcc: "" }`

5. **emailHealthCheck** - Health check for email service
   - Endpoint: `/emailHealthCheck`
   - Method: GET

## Setting Firebase Environment Variables

To configure the email backend, you need to set the following Firebase config variables:

```bash
# Set SMTP configuration
firebase functions:config:set smtp.host="smtp.ionos.de"
firebase functions:config:set smtp.port="587"
firebase functions:config:set smtp.user="bielefeld@relocato.de"
firebase functions:config:set smtp.pass="Bicm1308"
firebase functions:config:set smtp.from="bielefeld@relocato.de"
```

## Testing the Functions Locally

1. First, download the remote config:
```bash
firebase functions:config:get > .runtimeconfig.json
```

2. Start the Firebase emulator:
```bash
firebase emulators:start --only functions
```

3. Test the endpoints:
```bash
# Health check
curl http://localhost:5001/umzugsapp/us-central1/emailHealthCheck

# List emails
curl -X POST http://localhost:5001/umzugsapp/us-central1/listEmails \
  -H "Content-Type: application/json" \
  -d '{"folder": "INBOX", "page": 1, "limit": 10}'

# Send email
curl -X POST http://localhost:5001/umzugsapp/us-central1/sendEmail \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "content": "This is a test email from Firebase Functions"
  }'
```

## Deploying to Production

1. Deploy all functions:
```bash
firebase deploy --only functions
```

2. Deploy specific email functions:
```bash
firebase deploy --only functions:listEmails,functions:readEmail,functions:getEmailFolders,functions:sendEmail,functions:emailHealthCheck
```

## Using from Frontend

Update your frontend email service to use the Firebase Functions endpoints:

```javascript
// Example: List emails
const response = await fetch('https://europe-west1-umzugsapp.cloudfunctions.net/listEmails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    folder: 'INBOX',
    page: 1,
    limit: 50
  })
});

const data = await response.json();
```

## CORS Configuration

The functions are configured to accept requests from:
- All origins (origin: true)
- With credentials
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization, Origin, X-Requested-With, Accept

For production, you may want to restrict the origins to your specific domains.

## Error Handling

All functions return consistent error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

Successful responses:
```json
{
  "success": true,
  "data": { ... }
}
```

## Monitoring

Monitor function logs:
```bash
firebase functions:log
```

Monitor specific function:
```bash
firebase functions:log --only listEmails
```

## Important Notes

1. The IMAP and SMTP configurations use IONOS servers
2. TLS is configured with SSLv3 ciphers for compatibility
3. Connection and auth timeouts are set to 10 seconds
4. Email content is parsed using mailparser for proper handling of attachments
5. The functions handle CORS automatically for cross-origin requests

## Troubleshooting

1. **SMTP Connection Issues**: Check the SMTP credentials and ensure port 587 is not blocked
2. **IMAP Connection Issues**: Verify IMAP is enabled for the email account
3. **CORS Issues**: The functions are configured to accept all origins; check browser console for specific errors
4. **Authentication Issues**: Ensure Firebase config variables are set correctly