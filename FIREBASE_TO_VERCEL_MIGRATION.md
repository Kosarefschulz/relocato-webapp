# Firebase to Vercel Migration Guide

## Overview

This guide covers the complete migration from Firebase to Vercel for the Umzugs-WebApp.

## Migration Components

### 1. Database Migration (Firestore → PostgreSQL)

#### Export Firestore Data
```bash
# Install dependencies
cd migration
npm install firebase-admin

# Download service account key from Firebase Console
# Save as migration/serviceAccountKey.json

# Run export
node export-firestore.js
```

#### Setup PostgreSQL Database
```bash
# Create database
createdb umzugsapp

# Run schema
psql -d umzugsapp -f migration/database-schema.sql

# Run migration
node migrate-to-postgres.js
```

### 2. Authentication Migration

#### Firebase Auth → JWT-based Auth
- Users are migrated with their Firebase UIDs preserved
- New password-based authentication system
- Google OAuth support maintained
- JWT tokens for API authentication

### 3. Backend Migration

#### Firebase Functions → Vercel API Routes
The following functions have been migrated:

| Firebase Function | Vercel API Route | Description |
|------------------|------------------|-------------|
| `backendApi` | `/api/*` | General API endpoints |
| `importAllEmails` | `/api/emails/import` | Email import functionality |
| `scheduledEmailCheck` | Vercel Cron | Scheduled email checks |
| `syncEmailsForClient` | `/api/email/sync` | Email synchronization |

### 4. Frontend Updates

#### Update Environment Variables
Create `.env.local`:
```env
# API Configuration
REACT_APP_API_URL=https://your-app.vercel.app/api

# Remove Firebase variables
# REACT_APP_FIREBASE_API_KEY=...
# REACT_APP_FIREBASE_AUTH_DOMAIN=...
# etc.
```

#### Update Service Imports
Replace Firebase service imports:

```typescript
// Old
import { databaseService } from './services/unifiedDatabaseService';
import { authService } from './services/authService';

// New
import { databaseService } from './services/databaseServiceVercel';
import { authServiceVercel as authService } from './services/authServiceVercel';
```

#### Update Database Configuration
Edit `src/config/database.config.ts`:
```typescript
export const USE_FIREBASE_PRIMARY = false; // Set to false to use Vercel
```

### 5. Vercel Deployment

#### Install Vercel CLI
```bash
npm i -g vercel
```

#### Configure Vercel Project
```bash
vercel
```

#### Set Environment Variables
```bash
# Database
vercel env add POSTGRES_URL
vercel env add JWT_SECRET

# Email configuration (if needed)
vercel env add EMAIL_HOST
vercel env add EMAIL_PORT
vercel env add EMAIL_USER
vercel env add EMAIL_PASS
```

#### Deploy
```bash
vercel --prod
```

### 6. Migration Checklist

- [ ] Export all Firestore data
- [ ] Setup PostgreSQL database
- [ ] Run data migration scripts
- [ ] Update frontend service files
- [ ] Update environment variables
- [ ] Test authentication flow
- [ ] Test all CRUD operations
- [ ] Migrate scheduled functions to Vercel Cron
- [ ] Update DNS settings (if using custom domain)
- [ ] Monitor for errors post-deployment

### 7. Rollback Plan

If issues occur:
1. Keep Firebase project active during migration
2. Use feature flags to switch between Firebase/Vercel
3. Maintain data sync between both systems during transition
4. Have database backups before migration

### 8. Post-Migration

1. **Monitor Performance**
   - Check API response times
   - Monitor database queries
   - Track error rates

2. **Optimize**
   - Add database indexes as needed
   - Implement caching
   - Optimize API routes

3. **Clean Up**
   - Remove Firebase dependencies
   - Delete unused Firebase functions
   - Archive Firebase project (after stable period)

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure JWT_SECRET is set in Vercel
   - Check token expiration settings
   - Verify CORS configuration

2. **Database Connection**
   - Verify POSTGRES_URL is correct
   - Check connection pooling settings
   - Monitor connection limits

3. **API Errors**
   - Check Vercel function logs
   - Verify API route paths
   - Ensure proper error handling

## Support

For issues during migration:
1. Check Vercel logs: `vercel logs`
2. Monitor database: `psql -d umzugsapp`
3. Test API endpoints individually
4. Review error messages in browser console