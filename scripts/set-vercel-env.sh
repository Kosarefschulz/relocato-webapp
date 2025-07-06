#!/bin/bash

# Script to set Vercel environment variables
# Usage: ./scripts/set-vercel-env.sh

echo "Setting Vercel environment variables..."

# IONOS Email Configuration
vercel env add IONOS_EMAIL production < <(echo "bielefeld@relocato.de")
vercel env add IONOS_PASSWORD production < <(echo "Bicm1308")
vercel env add IONOS_SMTP_HOST production < <(echo "smtp.ionos.de")
vercel env add IONOS_SMTP_PORT production < <(echo "587")
vercel env add IONOS_IMAP_HOST production < <(echo "imap.ionos.de")
vercel env add IONOS_IMAP_PORT production < <(echo "993")

# Supabase Configuration
vercel env add NEXT_PUBLIC_SUPABASE_URL production < <(echo "https://kmxipuaqierjqaikuimi.supabase.co")
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < <(echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU")

# React App Configuration
vercel env add REACT_APP_SUPABASE_URL production < <(echo "https://kmxipuaqierjqaikuimi.supabase.co")
vercel env add REACT_APP_SUPABASE_ANON_KEY production < <(echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU")

echo "Environment variables set successfully!"