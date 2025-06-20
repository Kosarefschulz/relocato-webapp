#!/bin/bash

# Deploy Email Client to Firebase
echo "🚀 Starting Email Client deployment to Firebase..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Firebase CLI is not installed. Please install it first:${NC}"
    echo "npm install -g firebase-tools"
    exit 1
fi

# 1. Set environment variable to use Firebase
echo -e "${YELLOW}Setting environment to use Firebase...${NC}"
export REACT_APP_USE_FIREBASE=true

# 2. Build the React app
echo -e "${YELLOW}Building React app...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

# 3. Deploy Firebase Functions
echo -e "${YELLOW}Deploying Firebase Functions...${NC}"
cd functions
npm install
cd ..

# Deploy only the email functions
firebase deploy --only functions:getEmailFolders,functions:getEmails,functions:getEmail,functions:sendEmail,functions:deleteEmail,functions:moveEmail,functions:markAsRead,functions:markAsUnread,functions:searchEmails,functions:syncEmailsPeriodically,functions:triggerEmailSync

if [ $? -ne 0 ]; then
    echo -e "${RED}Functions deployment failed!${NC}"
    exit 1
fi

# 4. Deploy Firestore rules
echo -e "${YELLOW}Deploying Firestore rules...${NC}"
firebase deploy --only firestore:rules

# 5. Deploy hosting
echo -e "${YELLOW}Deploying to Firebase Hosting...${NC}"
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}Your app is now live at: https://umzugsapp.firebaseapp.com${NC}"
    echo ""
    echo -e "${YELLOW}Email Client Functions deployed:${NC}"
    echo "- getEmailFolders"
    echo "- getEmails"
    echo "- getEmail"
    echo "- sendEmail"
    echo "- deleteEmail"
    echo "- moveEmail"
    echo "- markAsRead"
    echo "- markAsUnread"
    echo "- searchEmails"
    echo "- syncEmailsPeriodically (runs every 15 minutes)"
    echo "- triggerEmailSync"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Test the email client at https://umzugsapp.firebaseapp.com"
    echo "2. Make sure users have 'emailAccess' field set to true in Firestore"
    echo "3. Monitor function logs: firebase functions:log"
else
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
fi