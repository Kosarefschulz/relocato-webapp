#!/bin/bash

echo "🔄 Restarting Backend Server..."

# Kill existing backend process
pkill -f "node.*backend/server.js" || true

# Navigate to backend directory
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the backend server
echo "🚀 Starting backend server..."
npm start &

echo "✅ Backend server started on port 3001"
echo "📧 Email API endpoints available:"
echo "   - POST /api/email/list"
echo "   - POST /api/email/read"
echo "   - POST /api/email/folders"
echo "   - POST /api/send-email"