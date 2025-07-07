#!/bin/bash
# Test script for PlotWeaver frontend multi-manuscript integration

echo "🚀 PlotWeaver Frontend Integration Test"
echo "========================================"
echo ""

# Check if backend is running
echo "1. Checking backend..."
if ! curl -s http://localhost:5000/api/v1/projects > /dev/null; then
    echo "❌ Backend not running!"
    echo "   Start it with: cd /home/tmcfar/dev/pw2 && source venv/bin/activate && python -m plotweaver.ui.app"
    exit 1
fi
echo "✅ Backend is running"

# Check if frontend dependencies are installed
echo ""
echo "2. Checking frontend dependencies..."
cd /home/tmcfar/dev/pw-web/frontend

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the frontend dev server
echo ""
echo "3. Starting frontend dev server..."
echo ""
echo "The frontend will start at http://localhost:3000"
echo ""
echo "Test the following features:"
echo "  - Project selector in the header"
echo "  - Create new project button"
echo "  - Project list page at /projects"
echo "  - Switch between projects"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
