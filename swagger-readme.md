PlotWeaver Development Guide for Claude
This guide helps Claude understand how to work with the PlotWeaver project, including launching services and using Swagger MCP tools.
Project Structure

Backend API (~/dev/pw2): Flask-based Python API on port 5000
Frontend/BFF (~/dev/pw-web): Next.js frontend with FastAPI BFF on port 8000

Starting the Services
Backend API (Flask - Port 5000)
bash# Terminal 1: Start PlotWeaver Backend
cd ~/dev/pw2
source venv/bin/activate
make dev
Verify backend is running:
bashcurl http://localhost:5000/api/swagger.json | jq . | head -10
Frontend with BFF (Next.js + FastAPI)
Start BFF Only (Port 8000)
bash# Terminal 2: Start BFF
cd ~/dev/pw-web/bff
source .venv/bin/activate
cd ..
make dev-backend
Verify BFF is running:
bashcurl http://localhost:8000/openapi.json | jq . | head -10
Start Full Frontend (Next.js + BFF)
bash# Terminal 3: Start both frontend and BFF
cd ~/dev/pw-web
make dev
This starts:

Next.js frontend on port 3000
FastAPI BFF on port 8000

Using Swagger MCP Tools
Claude has access to three MCP tools for working with APIs:
1. swagger-explorer (API Analysis)
Purpose: Analyze and explore API documentation
Usage Examples:
bash# Analyze backend API
claude "Use swagger-explorer to analyze the API at http://localhost:5000/api/swagger.json and list all endpoints"

# Analyze BFF API
claude "Use swagger-explorer to show me all endpoints in the BFF API at http://localhost:8000/openapi.json"

# Compare APIs
claude "Use swagger-explorer to compare the backend API (port 5000) and BFF API (port 8000)"
2. swagger-backend (Backend API Tools)
Purpose: Execute actual API calls to the Flask backend
Usage Examples:
bash# List available tools
claude "Connect to the swagger-backend MCP and list what API operations are available"

# Create a project
claude "Use swagger-backend to create a new project called 'Fantasy Novel' with description 'Epic adventure'"

# Get project list
claude "Use swagger-backend to list all existing projects"
3. swagger-bff (BFF API Tools)
Purpose: Execute actual API calls to the FastAPI BFF
Usage Examples:
bash# Check health
claude "Use swagger-bff to check the API health status"

# Git operations
claude "Use swagger-bff to get the current git status"

# Worldbuilding
claude "Use swagger-bff to analyze a story concept: 'A detective in a cyberpunk city'"
Common Development Workflows
1. Starting Fresh Development Session
bash# Terminal 1: Backend
cd ~/dev/pw2 && source venv/bin/activate && make dev

# Terminal 2: BFF
cd ~/dev/pw-web && make dev-backend

# Terminal 3: Use Claude
cd ~/dev/pw-web
claude "Verify both APIs are running using swagger-explorer"
2. API Development Workflow
bash# Explore API structure
claude "Use swagger-explorer to document all endpoints in the backend API"

# Test endpoint
claude "Use swagger-backend to test the project creation endpoint"

# Debug issues
claude "Show me the request/response format for the /api/v1/projects endpoint"
3. Full Stack Development
bash# Start everything
cd ~/dev/pw-web && make dev  # Starts frontend + BFF

# In another terminal
cd ~/dev/pw2 && source venv/bin/activate && make dev  # Backend

# Work with Claude
claude "Help me create a new story project and set up the initial chapters"
Troubleshooting
Backend Won't Start
bash# Check Python environment
cd ~/dev/pw2
source venv/bin/activate
pip install -r requirements.txt
BFF Import Errors
bash# Ensure in correct directory with venv
cd ~/dev/pw-web/bff
source .venv/bin/activate
cd ..
make dev-backend
MCP Tools Not Found
bash# List current MCPs
claude mcp list

# Re-add if missing
claude mcp add-json "swagger-explorer" '{"command":"npx","args":["-y","@johnneerdael/swagger-mcp"]}'
claude mcp add-json "swagger-backend" '{"command":"npx","args":["-y","swagger-mcp","--specUrl=http://localhost:5000/api/swagger.json"]}'
claude mcp add-json "swagger-bff" '{"command":"npx","args":["-y","swagger-mcp","--specUrl=http://localhost:8000/openapi.json"]}'
Ports Already in Use
bash# Find what's using the port
lsof -i :5000  # Backend
lsof -i :8000  # BFF
lsof -i :3000  # Frontend

# Kill if needed
kill -9 <PID>
API Endpoints Quick Reference
Backend (Port 5000) - Main Endpoints

/api/v1/projects - Project management
/api/generate/scene - Scene generation
/api/generate/chapter - Chapter generation
/auth/* - Authentication
/analytics/* - Analytics

BFF (Port 8000) - Main Endpoints

/health - API health check
/preview/* - Content preview
/git/* - Git operations
/worldbuilding/* - Story analysis
/feedback/* - User feedback
/ws - WebSocket connection

Best Practices

Always verify services are running before using MCP tools
Use swagger-explorer to understand API structure before making calls
Use swagger-backend/bff for actual API operations
Check logs if APIs fail to start:

Backend: Check terminal output
BFF: Check terminal output or uvicorn logs


Keep terminals organized - use named terminals or screen/tmux sessions

Example Claude Commands
bash# Full workflow example
claude "First use swagger-explorer to show me all project endpoints, then use swagger-backend to create a new project called 'Test Project', and finally list all projects to verify it was created"

# Debugging example
claude "The backend API is returning 500 errors. Use swagger-explorer to check the expected format for the project creation endpoint"

# Integration example
claude "Use swagger-backend to create a project, then use swagger-bff to analyze the worldbuilding for a fantasy story concept"