#!/bin/bash

# Local PostgreSQL Setup for Testing
# This allows testing the migration locally before deploying to Vercel

echo "🔧 Local PostgreSQL Setup"
echo "========================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo ""
    echo "Install with:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql"
    echo "  Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Start PostgreSQL if not running (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start postgresql 2>/dev/null
fi

# Create database
echo "📊 Creating database..."
createdb umzugsapp 2>/dev/null || echo "Database might already exist"

# Run schema
echo "📋 Creating schema..."
psql -d umzugsapp -f migration/vercel/vercel-schema.sql

# Create .env.local for local testing
echo ""
echo "📝 Creating local environment..."
cat > .env.local.postgres << EOF
# Local PostgreSQL Configuration
POSTGRES_URL=postgresql://localhost/umzugsapp
POSTGRES_DATABASE=umzugsapp
POSTGRES_HOST=localhost
POSTGRES_USER=$USER

# Application Settings
REACT_APP_USE_VERCEL=true
REACT_APP_API_URL=http://localhost:3000/api

# Copy other settings from .env.local
$(grep -E "^(REACT_APP_|IONOS_|JWT_)" .env.local 2>/dev/null || true)
EOF

echo ""
echo "✅ Local PostgreSQL setup complete!"
echo ""
echo "To use local database:"
echo "1. cp .env.local.postgres .env.local"
echo "2. npm run migrate:test"
echo ""
echo "Connection string: postgresql://localhost/umzugsapp"