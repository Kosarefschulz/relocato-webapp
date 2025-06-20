#!/bin/bash

# Deploy to Vercel - Complete Setup
# This script handles the complete deployment to Vercel

echo "🚀 Relocato WebApp - Complete Vercel Deployment"
echo "=============================================="
echo ""

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "📝 Please login to Vercel first..."
    vercel login
fi

echo ""
echo "✅ Logged in to Vercel"
echo ""

# Link to project
echo "🔗 Linking to Vercel project..."
vercel link --project=relocato-webapp-fzwo --yes

# Pull environment variables
echo ""
echo "📥 Pulling environment variables..."
vercel env pull .env.local

# Check if storage is configured
echo ""
echo "🔍 Checking Vercel Storage configuration..."
node scripts/check-vercel-status.js

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Please configure Vercel Storage in your dashboard:"
    echo "   https://vercel.com/dashboard/stores"
    echo ""
    echo "You need to create:"
    echo "1. Postgres Database (name: umzugsapp-db)"
    echo "2. Blob Store (name: umzugsapp-files)"
    echo "3. KV Store (name: umzugsapp-cache) - optional"
    echo ""
    echo "After creating, run: vercel env pull .env.local"
    echo "Then run this script again."
    exit 1
fi

# Create database schema
echo ""
echo "📊 Creating database schema..."
if [ -n "$POSTGRES_URL" ]; then
    psql $POSTGRES_URL -f migration/vercel/vercel-schema.sql
    echo "✅ Database schema created"
else
    echo "❌ POSTGRES_URL not found. Please configure Vercel Postgres first."
    exit 1
fi

# Check for Firebase service account
if [ ! -f "migration/serviceAccountKey.json" ]; then
    echo ""
    echo "⚠️  Firebase service account key not found!"
    echo "Please download it from Firebase Console:"
    echo "1. Go to Firebase Console > Project Settings > Service Accounts"
    echo "2. Click 'Generate new private key'"
    echo "3. Save as: migration/serviceAccountKey.json"
    echo ""
    read -p "Press Enter when ready..."
fi

# Run migration
echo ""
echo "🔄 Starting data migration..."
echo "This will migrate all data from Firebase to Vercel."
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    node migration/vercel/complete-migration.js
else
    echo "Migration cancelled."
    exit 1
fi

# Build the app
echo ""
echo "🏗️  Building the application..."
npm run build

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
echo ""
echo "Choose deployment type:"
echo "1) Preview deployment (test first)"
echo "2) Production deployment"
read -p "Select (1 or 2): " deploy_type

if [ "$deploy_type" = "2" ]; then
    vercel --prod
else
    vercel
fi

echo ""
echo "✨ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test all features on the deployed site"
echo "2. Update any webhooks or external integrations"
echo "3. Monitor the Vercel dashboard for any issues"
echo ""
echo "Your app is now running on Vercel! 🎉"