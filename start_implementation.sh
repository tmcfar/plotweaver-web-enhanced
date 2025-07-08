#!/bin/bash
# Make this script executable: chmod +x start_implementation.sh
# PlotWeaver Implementation Quick Start
# Run this to begin Phase 1 implementation

echo "🚀 PlotWeaver Implementation - Phase 1 Setup"
echo "==========================================="

# Check backend
echo "
📦 Checking backend status..."
cd ~/dev/pw2

# Install any missing dependencies
echo "Installing Flask-Session for session management..."
pip install flask-session redis

# Create a test script to verify API
cat > test_backend_api.py << 'EOF'
"""Quick test of PlotWeaver API endpoints"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_projects_api():
    """Test project management endpoints"""
    print("Testing PlotWeaver API...")
    
    # Test project list
    try:
        response = requests.get(f"{BASE_URL}/api/v1/projects")
        print(f"GET /api/v1/projects: {response.status_code}")
        if response.status_code == 200:
            print(f"Projects found: {len(response.json().get('projects', []))}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test CORS headers
    try:
        response = requests.options(
            f"{BASE_URL}/api/v1/projects",
            headers={"Origin": "http://localhost:3000"}
        )
        print(f"\nCORS Test: {response.status_code}")
        print(f"Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin')}")
    except Exception as e:
        print(f"CORS Error: {e}")

if __name__ == "__main__":
    test_projects_api()
EOF

echo "
✅ Backend test script created"

# Create implementation tracker
cat > implementation_status.md << 'EOF'
# PlotWeaver Implementation Status

## Phase 1: Foundation
- [ ] CORS configuration verified
- [ ] Session management added
- [ ] Projects API endpoints working
  - [ ] GET /api/v1/projects
  - [ ] POST /api/v1/projects  
  - [ ] GET /api/v1/projects/:id
  - [ ] POST /api/v1/projects/:id/activate
- [ ] Frontend mock data removed
- [ ] Project selector using real data

## Current Task
Working on: CORS configuration

## Notes
- Backend running on port 5000
- Frontend running on port 3000
- Using development mode
EOF

echo "
📋 Created implementation_status.md tracker"

# Start backend in new terminal
echo "
🚀 Starting backend server..."
echo "Run this in a new terminal:"
echo "cd ~/dev/pw2 && python -m plotweaver.ui.app"

# Frontend setup
echo "
🎨 Frontend checklist:"
echo "1. Remove mock data from ProjectSelector.tsx"
echo "2. Test with: cd ~/dev/pw-web/frontend && npm run dev"
echo "3. Open http://localhost:3000"

echo "
📝 Next steps:"
echo "1. Run: python test_backend_api.py"
echo "2. Fix any CORS or API issues"
echo "3. Update frontend to use real API"
echo "4. Check off items in implementation_status.md"

echo "
Ready to start! 🎉"
