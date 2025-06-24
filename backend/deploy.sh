#!/bin/bash

# RELOCATO® Backend Deployment Script for Vercel

echo "🚀 Starting RELOCATO® Backend deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it with: npm i -g vercel"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: No .env file found. Make sure to set environment variables in Vercel dashboard."
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."

# For production deployment
if [ "$1" = "production" ]; then
    echo "🏭 Deploying to production..."
    vercel --prod
else
    echo "🔧 Deploying to preview..."
    vercel
fi

echo "✅ Deployment complete!"
echo ""
echo "📝 Remember to set these environment variables in Vercel dashboard:"
echo "   - SMTP_HOST"
echo "   - SMTP_PORT"
echo "   - SMTP_USER"
echo "   - SMTP_PASS"
echo "   - SMTP_FROM"
echo "   - GOOGLE_CLIENT_EMAIL"
echo "   - GOOGLE_PRIVATE_KEY"
echo "   - GOOGLE_DRIVE_FOLDER_ID"
echo "   - GOOGLE_SHEETS_ID"
echo "   - PDFSHIFT_API_KEY"