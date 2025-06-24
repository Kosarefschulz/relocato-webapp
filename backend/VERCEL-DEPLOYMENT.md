# RELOCATO® Backend - Vercel Deployment Guide

## Prerequisites

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

## Environment Variables

Set the following environment variables in your Vercel project dashboard:

### SMTP Configuration (IONOS)
- `SMTP_HOST`: smtp.ionos.de
- `SMTP_PORT`: 587
- `SMTP_USER`: Your IONOS email address
- `SMTP_PASS`: Your IONOS email password
- `SMTP_FROM`: Sender email address (usually same as SMTP_USER)

### Google Services
- `GOOGLE_CLIENT_EMAIL`: Service account email
- `GOOGLE_PRIVATE_KEY`: Service account private key (include the full key with headers)
- `GOOGLE_DRIVE_FOLDER_ID`: Google Drive folder ID for uploads
- `GOOGLE_SHEETS_ID`: Google Sheets ID for quotes

### API Keys
- `PDFSHIFT_API_KEY`: PDFShift API key for PDF generation

## Deployment Steps

### 1. First-time Setup

Link your project to Vercel:
```bash
vercel
```

Follow the prompts to:
- Set up and deploy your project
- Choose the project name
- Link to existing project or create new

### 2. Deploy to Preview

For preview deployments:
```bash
npm run deploy
# or
./deploy.sh
```

### 3. Deploy to Production

For production deployments:
```bash
npm run deploy:prod
# or
./deploy.sh production
```

## API Endpoints

Once deployed, your API will be available at:
- Preview: `https://your-project-name.vercel.app`
- Production: `https://your-custom-domain.com`

### Available Endpoints:

- **Health Check**: `GET /api/health`
- **Send Email**: `POST /api/send-email`
- **Email List**: `POST /api/email/list`
- **Email Folders**: `POST /api/email/folders`
- **Read Email**: `POST /api/email/read`
- **Upload Photo**: `POST /api/upload-photo`
- **Get Photos**: `GET /api/customer-photos/:customerId`
- **Delete Photo**: `DELETE /api/delete-photo/:fileId`
- **Create Quote**: `POST /api/quotes`
- **Update Quote**: `PUT /api/quotes/:quoteId`
- **Generate PDF**: `POST /api/generate-pdf`
- **Test Email**: `POST /api/test-email`

## Troubleshooting

### CORS Issues
The backend is configured to accept requests from:
- Your production domain
- Localhost for development
- All Vercel preview URLs

### Function Timeout
- Default timeout is set to 30 seconds
- This should be sufficient for email operations
- Can be adjusted in `vercel.json` if needed

### Environment Variables Not Working
1. Make sure variables are set in Vercel dashboard
2. Redeploy after adding/changing variables
3. Check logs in Vercel dashboard for errors

### Google Drive/Sheets Not Working
1. Ensure service account has proper permissions
2. Private key must include full headers
3. Check that folder/sheet IDs are correct

## Monitoring

View logs and function performance in the Vercel dashboard:
1. Go to your project dashboard
2. Click on "Functions" tab
3. View real-time logs and metrics

## Region Configuration

The backend is configured to deploy to Frankfurt (fra1) region for optimal performance with European users. This can be changed in `vercel.json`.