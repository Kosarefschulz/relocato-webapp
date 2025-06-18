#!/bin/bash
# Script zum Setzen aller Environment Variables in Vercel

echo "📦 Setze Environment Variables für Vercel..."
echo "⚠️  Bitte stelle sicher, dass du mit 'vercel login' eingeloggt bist!"
echo ""

# Firebase Configuration
vercel env add REACT_APP_FIREBASE_API_KEY production < <(echo "AIzaSyDCeOBZw96klWFkolRQMnhr5DG4Ol2eMjY")
vercel env add REACT_APP_FIREBASE_AUTH_DOMAIN production < <(echo "umzugsapp.firebaseapp.com")
vercel env add REACT_APP_FIREBASE_PROJECT_ID production < <(echo "umzugsapp")
vercel env add REACT_APP_FIREBASE_STORAGE_BUCKET production < <(echo "umzugsapp.firebasestorage.app")
vercel env add REACT_APP_FIREBASE_MESSAGING_SENDER_ID production < <(echo "130199132038")
vercel env add REACT_APP_FIREBASE_APP_ID production < <(echo "1:130199132038:web:3be72ffeb2b1f55be93e07")
vercel env add REACT_APP_FIREBASE_MEASUREMENT_ID production < <(echo "G-MQWV0M47PN")

# Email Configuration
vercel env add REACT_APP_IMAP_SERVER production < <(echo "mail.ionos.de")
vercel env add REACT_APP_IMAP_PORT production < <(echo "993")
vercel env add REACT_APP_SMTP_SERVER production < <(echo "mail.ionos.de")
vercel env add REACT_APP_SMTP_PORT production < <(echo "465")
vercel env add REACT_APP_EMAIL_USERNAME production < <(echo "bielefeld@relocato.de")
vercel env add REACT_APP_EMAIL_PASSWORD production < <(echo "Bicm1308")

# Alternative SMTP Configuration
vercel env add SMTP_HOST production < <(echo "smtp.ionos.de")
vercel env add SMTP_PORT production < <(echo "587")
vercel env add SMTP_USER production < <(echo "bielefeld@relocato.de")
vercel env add SMTP_PASS production < <(echo "Bicm1308")
vercel env add SMTP_FROM production < <(echo "bielefeld@relocato.de")

# Backend Configuration
vercel env add REACT_APP_BACKEND_URL production < <(echo "https://europe-west1-umzugsapp.cloudfunctions.net/backendApi")
vercel env add REACT_APP_API_URL production < <(echo "https://api.ruempel-schmiede.com")

# Google Services
vercel env add REACT_APP_GOOGLE_SHEETS_API_KEY production < <(echo "AIzaSyDCeOBZw96klWFkolRQMnhr5DG4Ol2eMjY")
vercel env add REACT_APP_GOOGLE_SHEETS_ID production < <(echo "178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU")
vercel env add REACT_APP_SENDGRID_FROM_EMAIL production < <(echo "bielefeld@relocato.de")

echo ""
echo "✅ Alle Environment Variables wurden hinzugefügt!"
echo ""
echo "🚀 Nächste Schritte:"
echo "1. Führe 'vercel --prod' aus für ein neues Deployment"
echo "2. Oder warte auf automatisches Deployment nach Git Push"