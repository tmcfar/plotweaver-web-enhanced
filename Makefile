# PlotWeaver Web Application Makefile

.PHONY: help install up dev build test lint clean start stop

# Default target
help:
	@echo "PlotWeaver Web Application Makefile"
	@echo "Available targets:"
	@echo "  install      - Install all dependencies"
	@echo "  up           - Start production environment (use backend)"
	@echo "  dev          - Start development environment (use backend)"
	@echo "  build        - Build the application"
	@echo "  test         - Run tests"
	@echo "  lint         - Run linters"
	@echo "  clean        - Clean build artifacts"
	@echo "  start        - Start production servers"
	@echo "  stop         - Stop running servers"

# Install dependencies
install:
	npm install
	cd frontend && npm install
	cd bff && python3 -m venv venv && bash -c "source venv/bin/activate && pip install -r requirements.txt"

# Redirect to backend's fullstack setup
up:
	@echo "This command only works in the backend."
	@echo "Run: cd /home/tmcfar/dev/pw2 && make up"

dev:
	@echo "This command only works in the backend."
	@echo "Run: cd /home/tmcfar/dev/pw2 && make dev"

dev-frontend:
	cd frontend && npm run dev

dev-bff:
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

# Note: Docker commands removed - use backend's fullstack docker-compose setup