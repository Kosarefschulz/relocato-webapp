# Email System Test Report

Generated: 7/6/2025, 11:32:57 PM
URL: https://relocato-webapp-fzwo.vercel.app

## Summary
- Total Tests: 5
- Passed: 5 ✅
- Failed: 0 ❌
- Warnings: 0 ⚠️

## Test Results


### Email Folders
- Status: PASS
- Endpoint: /api/email-gateway






### Email List
- Status: PASS
- Endpoint: /api/email-gateway
- Emails Found: 5/3665





### Email Sending
- Status: PASS
- Endpoint: /api/test-email-system

- Message ID: <965713ed-1e71-f55a-c30d-2a2fe1a3e974@relocato.de>




### SMTP Connection
- Status: PASS
- Endpoint: /api/test-email-system






### Character Encoding
- Status: PASS



- Sample: Mail delivery failed: returning message to sender



## Recommendations





## Full Report Data

```json
{
  "timestamp": "2025-07-06T21:32:51.220Z",
  "url": "https://relocato-webapp-fzwo.vercel.app",
  "tests": [
    {
      "name": "Email Folders",
      "endpoint": "/api/email-gateway",
      "status": "PASS",
      "details": {
        "success": true,
        "folders": [
          {
            "name": "INBOX",
            "path": "INBOX",
            "delimiter": "/",
            "flags": [
              "\\HasNoChildren"
            ],
            "level": 0,
            "hasChildren": false,
            "specialUse": "inbox",
            "unreadCount": 0,
            "totalCount": 0,
            "attributes": [
              "\\Inbox"
            ]
          },
          {
            "name": "Gesendet",
            "path": "Gesendet",
            "delimiter": "/",
            "flags": [
              "\\HasNoChildren",
              "\\Sent"
            ],
            "level": 0,
            "hasChildren": false,
            "specialUse": "sent",
            "unreadCount": 0,
            "totalCount": 0,
            "attributes": [
              "\\Sent"
            ]
          },
          {
            "name": "Entwürfe",
            "path": "Entwürfe",
            "delimiter": "/",
            "flags": [
              "\\HasNoChildren",
              "\\Drafts"
            ],
            "level": 0,
            "hasChildren": false,
            "specialUse": "drafts",
            "unreadCount": 0,
            "totalCount": 0,
            "attributes": [
              "\\Drafts"
            ]
          },
          {
            "name": "Papierkorb",
            "path": "Papierkorb",
            "delimiter": "/",
            "flags": [
              "\\HasNoChildren",
              "\\Trash"
            ],
            "level": 0,
            "hasChildren": false,
            "specialUse": "trash",
            "unreadCount": 0,
            "totalCount": 0,
            "attributes": [
              "\\Trash"
            ]
          },
          {
            "name": "Spam",
            "path": "Spam",
            "delimiter": "/",
            "flags": [
              "\\HasNoChildren",
              "\\Junk"
            ],
            "level": 0,
            "hasChildren": false,
            "specialUse": "spam",
            "unreadCount": 0,
            "totalCount": 0,
            "attributes": [
              "\\Junk"
            ]
          }
        ],
        "server": {
          "host": "imap.ionos.de",
          "port": "993",
          "protocol": "IMAP4rev1",
          "capabilities": [
            "IMAP4rev1",
            "IDLE",
            "NAMESPACE",
            "QUOTA",
            "ID",
            "CHILDREN"
          ]
        }
      }
    },
    {
      "name": "Email List",
      "endpoint": "/api/email-gateway",
      "status": "PASS",
      "emailCount": 5,
      "totalEmails": 3665
    },
    {
      "name": "Email Sending",
      "endpoint": "/api/test-email-system",
      "status": "PASS",
      "messageId": "<965713ed-1e71-f55a-c30d-2a2fe1a3e974@relocato.de>"
    },
    {
      "name": "SMTP Connection",
      "endpoint": "/api/test-email-system",
      "status": "PASS"
    },
    {
      "name": "Character Encoding",
      "status": "PASS",
      "sample": "Mail delivery failed: returning message to sender"
    }
  ],
  "summary": {
    "total": 5,
    "passed": 5,
    "failed": 0,
    "warnings": 0
  }
}
```
