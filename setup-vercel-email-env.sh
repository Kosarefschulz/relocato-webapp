#!/bin/bash

# Vercel Email API Environment Variables Setup Script

echo "🔧 Setting up Vercel environment variables for Email API..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Email credentials
echo "📧 Setting IONOS email credentials..."
vercel env add IONOS_EMAIL_USER production < <(echo "bielefeld@relocato.de")
vercel env add IONOS_EMAIL_PASS production

# Firebase Service Account
echo "🔥 Setting Firebase service account..."
echo "Please paste your Firebase service account JSON (single line) and press Enter:"
read -r FIREBASE_SERVICE_ACCOUNT
vercel env add FIREBASE_SERVICE_ACCOUNT production < <(echo "$FIREBASE_SERVICE_ACCOUNT")

echo "✅ Environment variables have been set!"
echo ""
echo "📝 The following variables have been configured:"
echo "  - IONOS_EMAIL_USER"
echo "  - IONOS_EMAIL_PASS" 
echo "  - FIREBASE_SERVICE_ACCOUNT"
echo ""
echo "🚀 To deploy the API routes, run:"
echo "vercel --prod"
echo ""
echo "📖 For more information, see api/README.md"