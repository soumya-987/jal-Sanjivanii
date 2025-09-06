#!/bin/bash

echo "🐍 Activating Jal Sanjivani Virtual Environment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Activate Python virtual environment
source jal_sanjivani_env/bin/activate

echo "✅ Python virtual environment activated!"
echo ""
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "🌐 Node.js dependencies are already installed!"
echo ""
echo "🚀 Ready to run Jal Sanjivani!"
echo ""
echo "To start the website:"
echo "  node server.js"
echo ""
echo "To deactivate virtual environment later:"
echo "  deactivate"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"