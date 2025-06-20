#!/bin/bash

echo "🚀 Setting up Professional Email Client..."

# Create .env file for email backend if it doesn't exist
if [ ! -f email-backend/.env ]; then
    echo "📝 Creating email backend .env file..."
    cp email-backend/.env.example email-backend/.env
    echo ""
    echo "⚠️  Please update email-backend/.env with your IONOS credentials:"
    echo "   - EMAIL_USER=your-email@your-domain.com"
    echo "   - EMAIL_PASSWORD=your-password"
    echo "   - JWT_SECRET=your-secure-jwt-secret"
    echo ""
fi

# Install backend dependencies
echo "📦 Installing email backend dependencies..."
cd email-backend
npm install
cd ..

# Install frontend dependencies (react-quill and socket.io-client)
echo "📦 Installing frontend dependencies..."
npm install

echo ""
echo "✅ Email client setup complete!"
echo ""
echo "To start the email client:"
echo "1. Update email-backend/.env with your IONOS credentials"
echo "2. Run: npm run dev"
echo "3. Navigate to http://localhost:3001/email"
echo ""
echo "Features:"
echo "- Professional Gmail/Outlook-like interface"
echo "- Real-time email updates"
echo "- Rich text editor"
echo "- Attachment support"
echo "- Mobile responsive"
echo "- Folder navigation"
echo "- Search functionality"
echo ""