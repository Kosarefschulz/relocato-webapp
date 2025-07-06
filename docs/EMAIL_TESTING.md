# Email System Testing Guide

## Overview

This document describes how to test the email system functionality in the Umzugs-App.

## Test Tools Available

### 1. Email Test Tool UI (`/email-test-tool`)

A comprehensive UI-based testing tool that runs automated tests for:
- Email sending (text, HTML, attachments)
- Email reading (folders, emails, content)
- Email operations (mark read, star, delete, move)
- Customer linking
- Database persistence

**Access:** Navigate to `/email-test-tool` in your browser

### 2. API Test Endpoint (`/api/test-email-system`)

Direct API endpoint for testing email functionality:

```bash
# Test SMTP connection
curl -X POST https://your-app.vercel.app/api/test-email-system \
  -H "Content-Type: application/json" \
  -d '{"testSMTP": true}'

# Send test email
curl -X POST https://your-app.vercel.app/api/test-email-system \
  -H "Content-Type: application/json" \
  -d '{"sendTestEmail": true, "testEmail": "test@example.com"}'

# Test Supabase connection
curl -X POST https://your-app.vercel.app/api/test-email-system \
  -H "Content-Type: application/json" \
  -d '{"testSupabase": true}'
```

### 3. Automated Test Script

Run automated tests from command line:

```bash
# Test production
node scripts/test-email-vercel.js your-app.vercel.app

# Test with custom email
TEST_EMAIL=mytest@example.com node scripts/test-email-vercel.js your-app.vercel.app
```

## Test Coverage

### Email Sending Tests
- ✅ Simple text email
- ✅ HTML formatted email
- ✅ Email with attachments
- ✅ Multiple recipients

### Email Reading Tests
- ✅ Folder listing
- ✅ Email list retrieval
- ✅ Single email content
- ✅ MIME decoding
- ✅ Attachment handling

### Email Operations
- ✅ Mark as read/unread
- ✅ Star/unstar emails
- ✅ Delete emails
- ✅ Move between folders

### Customer Integration
- ✅ Link email to customer
- ✅ Unlink email from customer
- ✅ Get linked customer info

### Database Persistence
- ✅ Save emails to Supabase
- ✅ Read emails from database
- ✅ Update email flags
- ✅ Search functionality

## Required Environment Variables

Ensure these are set in your Vercel deployment:

```env
IONOS_EMAIL=bielefeld@relocato.de
IONOS_PASSWORD=your-password
IONOS_SMTP_HOST=smtp.ionos.de
IONOS_SMTP_PORT=587
IONOS_IMAP_HOST=imap.ionos.de
IONOS_IMAP_PORT=993

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Check IONOS credentials
   - Verify network connectivity
   - Check firewall rules for port 587

2. **Email Not Displaying**
   - Check MIME parsing in browser console
   - Verify email content is being fetched
   - Check for encoding issues

3. **Customer Linking Failed**
   - Ensure migrations are run
   - Check Supabase RLS policies
   - Verify customer exists

4. **Database Persistence Issues**
   - Check Supabase connection
   - Verify table schema matches
   - Check for unique constraint violations

### Debug Mode

Enable debug logging by adding to URL:
```
/email?debug=true
/email-test-tool?debug=true
```

## CI/CD Integration

Add to your deployment workflow:

```yaml
# .github/workflows/test.yml
- name: Test Email System
  run: |
    npm run test:email
  env:
    VERCEL_URL: ${{ secrets.VERCEL_URL }}
    TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
```

## Manual Testing Checklist

- [ ] Send test email from UI
- [ ] Receive and read test email
- [ ] Link email to customer
- [ ] Search for email
- [ ] Delete test email
- [ ] Check email appears in database
- [ ] Verify MIME decoding for special characters
- [ ] Test attachment upload/download

## Support

For issues or questions:
1. Check browser console for errors
2. Review Vercel function logs
3. Check Supabase logs
4. Contact development team