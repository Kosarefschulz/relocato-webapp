#!/bin/bash

echo "🚀 Starting Code Operations Backend..."

# Kill any existing process on port 3002
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Start the backend
CODE_BACKEND_PORT=3002 node code-backend.js
