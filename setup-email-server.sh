#!/bin/bash

echo "📧 Setting up local email server..."

# Install dependencies for the email server
echo "Installing email server dependencies..."
npm install express cors imap mailparser dotenv --save-dev

echo ""
echo "✅ Email server dependencies installed!"
echo ""
echo "To use the local email server:"
echo ""
echo "1. Create a .env file with your IONOS credentials:"
echo "   REACT_APP_EMAIL_USERNAME=your-email@ionos.de"
echo "   REACT_APP_EMAIL_PASSWORD=your-password"
echo ""
echo "2. Run the email server in a separate terminal:"
echo "   node src/localEmailServer.js"
echo ""
echo "3. Start the React app in another terminal:"
echo "   npm start"
echo ""
echo "The email client will now fetch real emails from IONOS!"