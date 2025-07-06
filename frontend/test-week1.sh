#!/bin/bash

echo "=== PlotWeaver Frontend Week 1 Implementation Test ==="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in frontend directory"
    echo "Please run this from: cd frontend"
    exit 1
fi

echo "🔍 Checking Node.js version..."
node_version=$(node --version)
echo "Node.js version: $node_version"

if [[ $node_version < "v20" ]]; then
    echo "⚠️  Warning: Node.js 20+ recommended for Next.js 15"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Running TypeScript check..."
npm run type-check

if [ $? -eq 0 ]; then
    echo "✅ TypeScript check passed!"
else
    echo "❌ TypeScript errors found"
    echo "Check the errors above and fix them before proceeding"
    exit 1
fi

echo ""
echo "🧹 Running linter..."
npm run lint

echo ""
echo "🏗️  Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Week 1 Implementation Test Complete!"
    echo ""
    echo "✅ All checks passed. Ready for testing:"
    echo "   1. Enhanced WebSocket with channels and reconnection"
    echo "   2. ModeSetSelector with migration warnings"
    echo "   3. Enhanced LockIndicator with tooltips and override"
    echo "   4. LockManagementPanel with tree view and bulk operations"
    echo "   5. ConflictResolutionDialog with AI suggestions"
    echo ""
    echo "🚀 To test the application:"
    echo "   npm run dev"
    echo ""
    echo "🔗 Backend integration:"
    echo "   Make sure FastAPI backend is running on localhost:8000"
    echo "   cd ../src && python -m uvicorn server.main:app --reload"
else
    echo "❌ Build failed. Check errors above."
    exit 1
fi