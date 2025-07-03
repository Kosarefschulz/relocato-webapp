# Supabase Migration Guide

This guide explains how to migrate your Umzugs-WebApp from Firebase to Supabase.

## Overview

The migration process is fully automated and includes:
1. Database schema creation in Supabase
2. Data migration from Firebase to Supabase
3. Application configuration update
4. Automatic fallback to Firebase if needed

## Prerequisites

- Node.js and npm installed
- Access to your Firebase project
- Supabase account and project created
- Your Supabase credentials (already configured)

## Quick Start - One Command Migration

Run the automated migration script:

```bash
./src/scripts/run-supabase-migration.sh
```

This script will:
1. Test Supabase connection
2. Create database schema
3. Migrate all data from Firebase
4. Update application configuration
5. Provide deployment instructions

## Manual Migration Steps

If you prefer to run each step manually:

### 1. Test Supabase Connection

```bash
npm run supabase:test
```

### 2. Create Database Schema

Option A - Using Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/kmxipuaqierjqaikuimi/sql
2. Copy contents of `src/scripts/supabase-schema.sql`
3. Paste and run in SQL editor

Option B - Using Supabase CLI:
```bash
npm run supabase:schema
```

### 3. Migrate Data

```bash
npm run supabase:migrate
```

This will migrate:
- Customers
- Quotes
- Invoices
- ShareLinks
- ShareTokens
- Email History
- Calendar Events

### 4. Switch to Supabase

```bash
npm run switch:supabase
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Database Provider
REACT_APP_DATABASE_PROVIDER=supabase

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://kmxipuaqierjqaikuimi.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU

# Automatic fallback to Firebase if Supabase fails
REACT_APP_DATABASE_AUTO_SWITCH=true
REACT_APP_DATABASE_FALLBACK=true
```

## Vercel Deployment

1. Add environment variables in Vercel dashboard:
   - `REACT_APP_DATABASE_PROVIDER` = `supabase`
   - `REACT_APP_SUPABASE_URL` = Your Supabase URL
   - `REACT_APP_SUPABASE_ANON_KEY` = Your Supabase anon key

2. Redeploy your application

## Features

### Automatic Fallback
If Supabase is unavailable, the app automatically falls back to Firebase.

### Real-time Updates
Supabase real-time subscriptions are configured for:
- Customer updates
- Quote updates
- Invoice updates

### Data Integrity
- All Firebase IDs are preserved
- Foreign key relationships maintained
- Soft deletes implemented (is_deleted flag)

## Troubleshooting

### Connection Issues
```bash
# Test Supabase connection
npm run supabase:test

# Check current provider
# In browser console:
console.log(databaseService.getCurrentProvider())
```

### Switch Back to Firebase
```bash
npm run switch:firebase
```

### View Migration Status
Check the `migration_status` table in Supabase dashboard.

## Database Schema

The Supabase schema includes:
- **customers** - Customer information with all Firebase fields
- **quotes** - Quote details with customer references
- **invoices** - Invoice records linked to quotes
- **share_links** - Employee share links (7-day expiry)
- **share_tokens** - Customer share links (30-day expiry)
- **email_history** - Email sending records
- **calendar_events** - Calendar appointments
- **migration_status** - Track migration progress

## Security

- Row Level Security (RLS) enabled on all tables
- Authenticated users have full access
- Public read access for valid share links/tokens
- All sensitive data encrypted in transit

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify environment variables are set
3. Ensure Supabase project is active
4. Check migration_status table for details

## Rollback Plan

If you need to rollback:
1. Set `REACT_APP_DATABASE_PROVIDER=firebase`
2. Restart the application
3. All Firebase data remains unchanged