# PlotWeaver Web Application Makefile
# =====================================
# This Makefile provides frontend and BFF-specific commands and coordinates with backend.
# 
# 📍 WHERE AM I?
# Repository: pw-web (Frontend & BFF)
# Services: Next.js frontend, FastAPI BFF
# 
# 🔄 CROSS-REPO COMMANDS
# Many commands coordinate with pw2 backend
# 
# 🆘 QUICK HELP
# Type 'make help-detail' for comprehensive command reference
# Type 'make which' to understand your current context
# Type 'make workflows' to see common development patterns

.PHONY: help help-detail which workflows install up dev build test lint clean start stop dev-frontend dev-bff frontend-health backend-dev backend-test backend-quality fullstack-up fullstack-down

# Default target - Quick help
help:
	@echo "🎨 PlotWeaver Web (pw-web) - Quick Commands"
	@echo "========================================="
	@echo ""
	@echo "📍 Context: Web Repository (pw-web)"
	@echo "    Services: Next.js frontend, FastAPI BFF"
	@echo ""
	@echo "🚀 Common Commands:"
	@echo "  make install       Install all dependencies"
	@echo "  make dev-frontend  Start frontend development"
	@echo "  make dev-bff       Start BFF development"
	@echo "  make build         Build the application"
	@echo "  make test          Run tests"
	@echo "  make lint          Run linters"
	@echo "  make clean         Clean build artifacts"
	@echo ""
	@echo "🔍 Discovery Commands:"
	@echo "  make which         Show current context and available commands"
	@echo "  make workflows     Show common development workflows"
	@echo "  make help-detail   Show comprehensive command reference"
	@echo ""
	@echo "🌐 Cross-repo Shortcuts:"
	@echo "  make backend-dev   Start backend development (pw2)"
	@echo "  make fullstack-up  Start fullstack services"
	@echo ""
	@echo "💡 Tip: Use 'make help-detail' for complete command list"

# Comprehensive help
help-detail:
	@echo "🎨 PlotWeaver Web (pw-web) - Detailed Commands"
	@echo "==========================================="
	@echo ""
	@echo "📍 CONTEXT:"
	@echo "  Repository: pw-web (Frontend & BFF)"
	@echo "  Location: $(PWD)"
	@echo "  Services: Next.js frontend, FastAPI BFF"
	@echo ""
	@echo "🏗️ SETUP & INSTALLATION:"
	@echo "  install           Install all dependencies (frontend + BFF)"
	@echo "  clean             Clean build artifacts"
	@echo ""
	@echo "🎨 FRONTEND DEVELOPMENT:"
	@echo "  dev-frontend      Start Next.js development server"
	@echo "  build             Build the frontend application"
	@echo "  start             Start production frontend server"
	@echo ""
	@echo "🔌 BFF DEVELOPMENT:"
	@echo "  dev-bff           Start FastAPI BFF development server"
	@echo ""
	@echo "✅ TESTING & QUALITY:"
	@echo "  test              Run frontend tests"
	@echo "  test-coverage     Run tests with coverage"
	@echo "  lint              Run linters"
	@echo "  type-check        Run TypeScript type checking"
	@echo ""
	@echo "🌐 CROSS-REPO COMMANDS:"
	@echo "  backend-dev       Start backend development (calls pw2)"
	@echo "  backend-test      Run backend tests (calls pw2)"
	@echo "  backend-quality   Run backend quality checks (calls pw2)"
	@echo "  fullstack-up      Start fullstack services"
	@echo "  fullstack-down    Stop fullstack services"
	@echo ""
	@echo "🚨 UTILITIES:"
	@echo "  stop              Stop running servers"
	@echo "  up                Start production environment (deprecated - use backend)"
	@echo "  dev               Start development environment (deprecated - use backend)"
	@echo ""
	@echo "🩺 HEALTH & ANALYSIS:"
	@echo "  frontend-health   Frontend-specific health status"
	@echo ""
	@echo "🔍 DISCOVERY:"
	@echo "  which             Show current context and available commands"
	@echo "  workflows         Show common development workflows"
	@echo "  help              Show quick help"
	@echo "  help-detail       Show this detailed help"

# Install dependencies
install:
	npm install
	cd frontend && npm install
	cd bff && python3 -m venv venv && bash -c "source venv/bin/activate && pip install -r requirements.txt"

# Context detection and guidance
which:
	@echo "📍 PlotWeaver Context Information"
	@echo "================================"
	@echo "Current Repository: pw-web (Frontend & BFF)"
	@echo "Location: $(PWD)"
	@echo "Primary Services: Next.js frontend, FastAPI BFF"
	@echo ""
	@echo "🏗️ Repository Structure:"
	@echo "  📁 frontend/         - Next.js frontend application"
	@echo "  📁 bff/              - FastAPI BFF (Backend for Frontend)"
	@echo "  📄 Makefile          - Web commands (current)"
	@echo ""
	@echo "🔗 Related Repositories:"
	@echo "  📁 ../pw2/           - Backend (Flask API, Python agents)"
	@echo "  📁 ../pw-docs/       - Documentation and health tools"
	@echo ""
	@echo "💡 Common Next Steps:"
	@echo "  For frontend work:    make dev-frontend"
	@echo "  For BFF work:         make dev-bff"
	@echo "  For backend work:     make backend-dev"
	@echo "  For fullstack work:   make fullstack-up"
	@echo ""
	@echo "📚 More Information:"
	@echo "  make workflows        - Show development workflows"
	@echo "  make help-detail      - Show all available commands"

workflows:
	@echo "🚀 PlotWeaver Development Workflows"
	@echo "==================================="
	@echo ""
	@echo "🎨 Frontend Development (Current Repository):"
	@echo "  1. make install        # Install dependencies"
	@echo "  2. make dev-frontend   # Start Next.js server"
	@echo "  3. make test           # Run frontend tests"
	@echo "  4. make build          # Build frontend"
	@echo ""
	@echo "🔌 BFF Development (Current Repository):"
	@echo "  1. make install        # Install dependencies"
	@echo "  2. make dev-bff        # Start FastAPI BFF server"
	@echo ""
	@echo "🔧 Backend Development (Cross-repo):"
	@echo "  1. make backend-dev    # Start backend development"
	@echo "  2. make backend-test   # Run backend tests"
	@echo "  3. make backend-quality # Check backend quality"
	@echo ""
	@echo "🌐 Fullstack Development:"
	@echo "  1. make fullstack-up   # Start all services"
	@echo "  2. make fullstack-down # Stop all services"
	@echo ""
	@echo "💡 Tip: Use 'make which' to see your current context"

# Redirect to backend's fullstack setup with better guidance
up:
	@echo "⚠️  This command is deprecated in pw-web"
	@echo "Use fullstack commands instead:"
	@echo "  make fullstack-up     # Start all services"
	@echo "  make backend-dev      # Start backend only"
	@echo ""
	@echo "Or run from backend repository:"
	@echo "  cd ../pw2 && make up"

dev:
	@echo "⚠️  This command is deprecated in pw-web"
	@echo "Use specific development commands:"
	@echo "  make dev-frontend     # Start frontend development"
	@echo "  make dev-bff          # Start BFF development"
	@echo "  make backend-dev      # Start backend development"
	@echo ""
	@echo "Or run from backend repository:"
	@echo "  cd ../pw2 && make dev"

dev-frontend:
	@echo "🎨 Starting Next.js frontend development server..."
	cd frontend && npm run dev

dev-bff:
	@echo "🔌 Starting FastAPI BFF development server..."
	bash -c "source bff/venv/bin/activate && python -m uvicorn bff.server.main:app --reload --host 0.0.0.0 --port 8000"

# Build
build:
	cd frontend && npm run build

# Testing
test:
	cd frontend && npm run test

test-coverage:
	cd frontend && npm run test:coverage

# Linting
lint:
	cd frontend && npm run lint

type-check:
	cd frontend && npm run type-check

# Clean
clean:
	cd frontend && rm -rf .next node_modules coverage
	rm -rf node_modules
	cd bff && find . -name "*.pyc" -delete && find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Production
start:
	cd frontend && npm run start

# Stop processes (kills common dev ports)
stop:
	@echo "Stopping development servers..."
	@-pkill -f "next dev" 2>/dev/null || true
	@-pkill -f "uvicorn.*main:app" 2>/dev/null || true
	@-lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@-lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	@echo "Development servers stopped"

# Frontend health check
frontend-health:
	@echo "🎨 Frontend (pw-web) Health Status"
	@echo "=================================="
	@echo "Generated: $$(date '+%a %b %d %H:%M:%S %Z %Y')"
	@echo ""
	@echo "📊 Frontend Services:"
	@echo "  - Next.js Frontend: Port 3000"
	@echo "  - FastAPI BFF: Port 8000"
	@echo ""
	@echo "📁 Frontend Structure:"
	@if [ -d "frontend/src" ]; then echo "  ✅ Frontend source (found)"; else echo "  ❌ Frontend source (missing)"; fi
	@if [ -d "frontend/app" ]; then echo "  ✅ Next.js app directory (found)"; else echo "  ❌ Next.js app directory (missing)"; fi
	@if [ -d "bff" ]; then echo "  ✅ BFF directory (found)"; else echo "  ❌ BFF directory (missing)"; fi
	@echo ""
	@echo "📦 Dependencies:"
	@if [ -f "frontend/package.json" ]; then echo "  ✅ Frontend package.json (found)"; else echo "  ❌ Frontend package.json (missing)"; fi
	@if [ -f "bff/requirements.txt" ]; then echo "  ✅ BFF requirements.txt (found)"; else echo "  ❌ BFF requirements.txt (missing)"; fi
	@echo ""
	@echo "💡 Next Steps:"
	@echo "  - Run 'make dev-frontend' to start frontend"
	@echo "  - Run 'make dev-bff' to start BFF"
	@echo "  - Check 'make test' for frontend tests"

# Cross-repo commands - Backend Development
backend-dev:
	@echo "🔧 Starting backend development (pw2)..."
	@if [ -d "../pw2" ]; then \
		cd ../pw2 && make dev; \
	else \
		echo "❌ pw2 repository not found at ../pw2"; \
		echo "Please clone pw2 repository or adjust path"; \
	fi

backend-test:
	@echo "🧪 Running backend tests (pw2)..."
	@if [ -d "../pw2" ]; then \
		cd ../pw2 && make test; \
	else \
		echo "❌ pw2 repository not found at ../pw2"; \
		echo "Please clone pw2 repository or adjust path"; \
	fi

backend-quality:
	@echo "✅ Running backend quality checks (pw2)..."
	@if [ -d "../pw2" ]; then \
		cd ../pw2 && make quality; \
	else \
		echo "❌ pw2 repository not found at ../pw2"; \
		echo "Please clone pw2 repository or adjust path"; \
	fi

# Fullstack commands (delegates to backend)
fullstack-up:
	@echo "🚀 Starting fullstack services (via pw2)..."
	@if [ -d "../pw2" ]; then \
		cd ../pw2 && make up; \
	else \
		echo "❌ pw2 repository not found at ../pw2"; \
		echo "Please clone pw2 repository or adjust path"; \
	fi

fullstack-down:
	@echo "🛑 Stopping fullstack services (via pw2)..."
	@if [ -d "../pw2" ]; then \
		cd ../pw2 && make down; \
	else \
		echo "❌ pw2 repository not found at ../pw2"; \
		echo "Please clone pw2 repository or adjust path"; \
	fi

# Note: Docker commands removed - use backend's fullstack docker-compose setup
# Cross-repo coordination is handled through the commands above