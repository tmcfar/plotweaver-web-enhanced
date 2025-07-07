#!/bin/bash
# Complete test script for multi-manuscript management

echo "🧪 PlotWeaver Multi-Manuscript Test Suite"
echo "========================================="
echo ""

# Function to check if a service is running
check_service() {
    local name=$1
    local url=$2
    local port=$3
    
    echo -n "Checking $name (port $port)... "
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ Running"
        return 0
    else
        echo "❌ Not running"
        return 1
    fi
}

# 1. Check backend
if ! check_service "Backend API" "http://localhost:5000/api/v1/projects" "5000"; then
    echo ""
    echo "To start the backend:"
    echo "  cd /home/tmcfar/dev/pw2"
    echo "  source venv/bin/activate"
    echo "  python -m plotweaver.ui.app"
    echo ""
fi

# 2. Check BFF (if used)
check_service "BFF" "http://localhost:8000/health" "8000" || true

# 3. Check frontend
if ! check_service "Frontend" "http://localhost:3000" "3000"; then
    echo ""
    echo "To start the frontend:"
    echo "  cd /home/tmcfar/dev/pw-web/frontend"
    echo "  npm install"
    echo "  npm run dev"
    echo ""
fi

echo ""
echo "Test Checklist:"
echo "==============="
echo ""
echo "Backend Tests:"
echo "  [ ] GET http://localhost:5000/api/v1/projects - List projects"
echo "  [ ] POST http://localhost:5000/api/v1/projects - Create project"
echo "  [ ] GET http://localhost:5000/api/v1/projects/active - Get active project"
echo ""
echo "Frontend Tests:"
echo "  [ ] Project selector visible in header"
echo "  [ ] Can open project dropdown"
echo "  [ ] 'New Project' button works"
echo "  [ ] Project creation wizard completes"
echo "  [ ] Projects appear in selector after creation"
echo "  [ ] Switching projects updates UI"
echo "  [ ] /projects page shows all projects"
echo ""
echo "Integration Tests:"
echo "  [ ] Create project in frontend → Appears in backend"
echo "  [ ] Switch project → Session persists on refresh"
echo "  [ ] Delete project → Removed from both UI and DB"
echo ""

# Quick API test
echo "Quick API Test:"
echo "==============="
echo ""

if check_service "Backend API" "http://localhost:5000/api/v1/projects" "5000" > /dev/null 2>&1; then
    echo "Testing project list endpoint..."
    response=$(curl -s http://localhost:5000/api/v1/projects)
    
    if echo "$response" | grep -q "projects"; then
        project_count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d: -f2)
        echo "✅ API working - Found $project_count projects"
    else
        echo "❌ API error: $response"
    fi
else
    echo "⏭️  Skipping API test - backend not running"
fi

echo ""
echo "Documentation:"
echo "============="
echo "- Backend: /home/tmcfar/dev/pw2/MULTI_MANUSCRIPT_IMPLEMENTATION.md"
echo "- Frontend: /home/tmcfar/dev/pw-web/FRONTEND_INTEGRATION.md"
echo "- API Guide: /home/tmcfar/dev/pw2/docs/MULTI_MANUSCRIPT_GUIDE.md"
echo ""
echo "Happy testing! 🚀"
