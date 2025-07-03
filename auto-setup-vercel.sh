#!/bin/bash

echo "🚀 Automatisches Vercel Environment Setup"
echo "=========================================="

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI ist nicht installiert. Installiere..."
    npm install -g vercel
fi

echo "📝 Setze Vercel Environment Variables..."

# Set environment variables
echo "supabase" | npx vercel env add REACT_APP_DATABASE_PROVIDER production
echo "true" | npx vercel env add REACT_APP_DATABASE_AUTO_SWITCH production  
echo "true" | npx vercel env add REACT_APP_DATABASE_FALLBACK production
echo "https://kmxipuaqierjqaikuimi.supabase.co" | npx vercel env add REACT_APP_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU" | npx vercel env add REACT_APP_SUPABASE_ANON_KEY production

echo "🚀 Starte Production Deployment..."
npx vercel --prod

echo "✅ Setup abgeschlossen!"
echo "🔗 Ihre App sollte jetzt mit Supabase funktionieren."