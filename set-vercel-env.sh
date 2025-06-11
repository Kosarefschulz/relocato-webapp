#!/bin/bash

# Vercel Environment Variables Setup Script

echo "🚀 Setze Vercel Umgebungsvariablen..."

# Lade die .env Datei
source .env

# Setze die Umgebungsvariablen in Vercel
echo "📝 Setze REACT_APP_GOOGLE_DRIVE_CLIENT_EMAIL..."
vercel env add REACT_APP_GOOGLE_DRIVE_CLIENT_EMAIL production < <(echo "$REACT_APP_GOOGLE_DRIVE_CLIENT_EMAIL")

echo "📝 Setze REACT_APP_GOOGLE_DRIVE_FOLDER_ID..."
vercel env add REACT_APP_GOOGLE_DRIVE_FOLDER_ID production < <(echo "$REACT_APP_GOOGLE_DRIVE_FOLDER_ID")

echo "📝 Setze REACT_APP_GOOGLE_DRIVE_PRIVATE_KEY..."
vercel env add REACT_APP_GOOGLE_DRIVE_PRIVATE_KEY production < <(echo "$REACT_APP_GOOGLE_DRIVE_PRIVATE_KEY")

echo "📝 Setze REACT_APP_GOOGLE_DRIVE_PROJECT_ID..."
vercel env add REACT_APP_GOOGLE_DRIVE_PROJECT_ID production < <(echo "$REACT_APP_GOOGLE_DRIVE_PROJECT_ID")

echo "✅ Umgebungsvariablen gesetzt!"
echo ""
echo "🔄 Triggere neues Deployment..."
vercel --prod

echo "✅ Fertig! Die App wird neu deployed mit Google Drive Integration."