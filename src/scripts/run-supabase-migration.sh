#!/bin/bash

# Automated Supabase Migration Script
# This script handles the complete migration from Firebase to Supabase

set -e  # Exit on error

echo "🚀 Starting automated Supabase migration..."
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required environment variables are set
if [ -z "$REACT_APP_SUPABASE_URL" ] || [ -z "$REACT_APP_SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}Warning: Supabase environment variables not found. Using defaults from config.${NC}"
fi

# Step 1: Test Supabase connection
echo -e "\n${YELLOW}Step 1: Testing Supabase connection...${NC}"
npm run supabase:test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Supabase connection successful${NC}"
else
    echo -e "${RED}❌ Supabase connection failed. Please check your credentials.${NC}"
    exit 1
fi

# Step 2: Create database schema
echo -e "\n${YELLOW}Step 2: Creating database schema in Supabase...${NC}"
echo "This will create all necessary tables and indexes."

# Use Supabase CLI if available, otherwise use the SQL directly in Supabase dashboard
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    # Get the database URL from Supabase dashboard
    read -p "Please enter your Supabase database URL (from Settings > Database): " SUPABASE_DB_URL
    export SUPABASE_DB_URL
    npm run supabase:schema
else
    echo -e "${YELLOW}Supabase CLI not found. Please run the following SQL in your Supabase SQL editor:${NC}"
    echo -e "${YELLOW}Dashboard URL: https://supabase.com/dashboard/project/${REACT_APP_SUPABASE_URL##*/}/sql${NC}"
    cat src/scripts/supabase-schema.sql
    read -p "Press Enter after you've executed the SQL in Supabase dashboard..."
fi

# Step 3: Run data migration
echo -e "\n${YELLOW}Step 3: Migrating data from Firebase to Supabase...${NC}"
echo "This will copy all your data from Firebase to Supabase."
read -p "Do you want to proceed with data migration? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run supabase:migrate
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Data migration completed${NC}"
    else
        echo -e "${RED}❌ Data migration failed. Please check the logs above.${NC}"
        exit 1
    fi
else
    echo "Data migration skipped."
fi

# Step 4: Test the migration
echo -e "\n${YELLOW}Step 4: Testing the migration...${NC}"
echo "Checking if data was migrated successfully..."

# Create a simple test script
cat > test-migration.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMigration() {
    console.log('Testing migration...\n');
    
    // Test customers
    const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('count')
        .limit(1);
    
    if (customersError) {
        console.error('❌ Error querying customers:', customersError);
    } else {
        console.log(`✅ Customers table accessible. Count query successful.`);
    }
    
    // Test quotes
    const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('count')
        .limit(1);
    
    if (quotesError) {
        console.error('❌ Error querying quotes:', quotesError);
    } else {
        console.log(`✅ Quotes table accessible. Count query successful.`);
    }
    
    // Test share_tokens
    const { data: shareTokens, error: shareTokensError } = await supabase
        .from('share_tokens')
        .select('count')
        .limit(1);
    
    if (shareTokensError) {
        console.error('❌ Error querying share_tokens:', shareTokensError);
    } else {
        console.log(`✅ Share tokens table accessible. Count query successful.`);
    }
    
    console.log('\nMigration test completed!');
}

testMigration().catch(console.error);
EOF

node test-migration.js
rm test-migration.js

# Step 5: Update configuration
echo -e "\n${YELLOW}Step 5: Updating application configuration...${NC}"
read -p "Do you want to switch the application to use Supabase now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create or update .env.local
    cat > .env.local << EOF
# Supabase Configuration
REACT_APP_DATABASE_PROVIDER=supabase
REACT_APP_SUPABASE_URL=https://kmxipuaqierjqaikuimi.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU
REACT_APP_DATABASE_AUTO_SWITCH=true
REACT_APP_DATABASE_FALLBACK=true

# Keep Firebase as fallback
REACT_APP_FIREBASE_API_KEY=AIzaSyDCeOBZw96klWFkolRQMnhr5DG4Ol2eMjY
REACT_APP_FIREBASE_AUTH_DOMAIN=umzugsapp.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=umzugsapp
REACT_APP_FIREBASE_STORAGE_BUCKET=umzugsapp.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=130199132038
REACT_APP_FIREBASE_APP_ID=1:130199132038:web:3be72ffeb2b1f55be93e07
REACT_APP_FIREBASE_MEASUREMENT_ID=G-MQWV0M47PN
EOF
    echo -e "${GREEN}✅ Configuration updated to use Supabase${NC}"
else
    echo "Configuration update skipped. You can manually switch later using: npm run switch:supabase"
fi

# Step 6: Deploy to Vercel
echo -e "\n${YELLOW}Step 6: Deployment${NC}"
echo "To deploy to Vercel with Supabase:"
echo "1. Add these environment variables in Vercel dashboard:"
echo "   - REACT_APP_DATABASE_PROVIDER=supabase"
echo "   - REACT_APP_SUPABASE_URL=https://kmxipuaqierjqaikuimi.supabase.co"
echo "   - REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
echo "2. Redeploy your application"

read -p "Do you want to open Vercel dashboard now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://vercel.com/dashboard"
fi

echo -e "\n${GREEN}🎉 Migration process completed!${NC}"
echo -e "${GREEN}Your application is now ready to use Supabase.${NC}"
echo -e "\nNext steps:"
echo -e "1. Test the application locally: ${YELLOW}npm run switch:supabase${NC}"
echo -e "2. Update Vercel environment variables"
echo -e "3. Redeploy to Vercel"
echo -e "\nIf you encounter any issues, you can switch back to Firebase:"
echo -e "${YELLOW}npm run switch:firebase${NC}"