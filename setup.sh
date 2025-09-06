#!/bin/bash

echo "🌊 Setting up Jal Sanjivani Health Monitoring System..."

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

echo "✅ Node.js and npm found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create uploads directory
if [ ! -d "uploads" ]; then
    mkdir uploads
    echo "📁 Created uploads directory"
fi

# Initialize database (will be created automatically by SQLite)
echo "🗄️  Database will be initialized on first run"

# Set executable permissions
chmod +x setup.sh

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  npm start           # Start production server"
echo "  npm run dev         # Start development server with auto-reload"
echo ""
echo "The application will be available at:"
echo "  Main Dashboard:     http://localhost:3000"
echo "  Analytics:          http://localhost:3000/analytics.html"
echo ""
echo "Features available:"
echo "  ✅ Case reporting and tracking"
echo "  ✅ Water quality monitoring"
echo "  ✅ Real-time alerts and notifications"
echo "  ✅ Volunteer management"
echo "  ✅ Data visualization and analytics"
echo "  ✅ Mobile-responsive design"
echo ""
echo "Happy monitoring! 🏥💧"