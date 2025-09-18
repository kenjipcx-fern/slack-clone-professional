#!/bin/bash

echo "🚀 Deploying Slack Clone to production..."

# Kill existing processes on port 4000
echo "📋 Cleaning up existing processes..."
pkill -f "next.*4000" || true
sleep 2

# Start backend on port 3002 (if not already running)
echo "🔧 Ensuring backend is running..."
cd /root/slack-competitor-build-dec18/backend
if ! pgrep -f "node.*server.js" > /dev/null; then
    echo "Starting backend..."
    npm run dev > ../backend.log 2>&1 &
    sleep 3
fi

# Build and start frontend on port 4000
echo "🎨 Building and starting frontend..."
cd /root/slack-competitor-build-dec18/frontend

# Build the Next.js app
npm run build

# Start the production server on port 4000
PORT=4000 npm start > ../frontend.log 2>&1 &

echo "⏳ Waiting for services to start..."
sleep 5

echo "✅ Deployment complete!"
echo "📱 Frontend: https://slack-clone-app-morphvm-hy4i6u97.http.cloud.morph.so"
echo "🔧 Backend: http://localhost:3002"

# Show status
echo "📊 Service status:"
ps aux | grep -E "(node|next)" | grep -v grep
