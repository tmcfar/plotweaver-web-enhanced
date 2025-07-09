# PlotWeaver Web Application Makefile

.PHONY: help install dev build test lint clean start stop docker-build docker-dev docker-up docker-down docker-logs docker-clean

# Default target
help:
	@echo "PlotWeaver Web Application Makefile"
	@echo "Available targets:"
	@echo "  install      - Install all dependencies"
	@echo "  dev          - Start development servers"
	@echo "  build        - Build the application"
	@echo "  test         - Run tests"
	@echo "  lint         - Run linters"
	@echo "  clean        - Clean build artifacts"
	@echo "  start        - Start production servers"
	@echo "  stop         - Stop running servers"
	@echo ""
	@echo "Docker targets:"
	@echo "  docker-build - Build Docker images"
	@echo "  docker-dev   - Start development environment with Docker"
	@echo "  docker-up    - Start production environment with Docker"
	@echo "  docker-down  - Stop Docker containers"
	@echo "  docker-logs  - View Docker logs"
	@echo "  docker-clean - Clean Docker artifacts"

# Install dependencies
install:
	npm install
	cd frontend && npm install
	cd bff && python3 -m venv venv && bash -c "source venv/bin/activate && pip install -r requirements.txt"

# Development
dev:
	npm run dev

dev-frontend:
	cd frontend && npm run dev

dev-backend:
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

# Docker targets
docker-build:
	@echo "Building Docker images..."
	docker compose build

docker-dev:
	@echo "Starting development environment with Docker..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

docker-up:
	@echo "Starting production environment with Docker..."
	docker compose up -d --build

docker-down:
	@echo "Stopping Docker containers..."
	docker compose down

docker-logs:
	@echo "Viewing Docker logs..."
	docker compose logs -f

docker-clean:
	@echo "Cleaning Docker artifacts..."
	docker compose down -v --rmi all --remove-orphans
	docker system prune -f