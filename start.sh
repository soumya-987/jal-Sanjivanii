#!/bin/bash

# Jal Sanjivani Data Processing System Startup Script

echo "🚀 Starting Jal Sanjivani Data Processing System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies."
        exit 1
    fi
    echo "✅ Dependencies installed successfully!"
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir -p uploads
fi

# Start the server
echo "🌐 Starting the server..."
echo "📍 Dashboard will be available at: http://localhost:3000"
echo "📊 Analytics at: http://localhost:3000/analytics.html"
echo "📝 Data Forms at: http://localhost:3000/data-forms.html"
echo "📋 Reports at: http://localhost:3000/reports.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the Node.js server
node server.js