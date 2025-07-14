# PlotWeaver Web Development Guide for AI Assistants

## 🎯 Repository Overview

This repository contains the **Frontend** and **BFF (Backend for Frontend)** services for PlotWeaver. It works in conjunction with the main backend repository at `/home/tmcfar/dev/pw2`.

## 🚨 Important: Docker Setup Changes

**DO NOT USE LOCAL DOCKER COMMANDS** - This repository's Docker setup has been integrated into the backend's fullstack environment.

### ❌ Commands That No Longer Work
```bash
# These commands are DISABLED
make docker-up
make docker-dev
make docker-build
docker-compose up
```

### ✅ Correct Development Setup
```bash
# Use the backend's fullstack environment
cd /home/tmcfar/dev/pw2
make up        # Start fullstack development environment
make dev       # Alternative development command
```

## 🏗️ Repository Structure

```
pw-web/
├── frontend/              # Next.js 14 React application
│   ├── app/              # App Router pages
│   ├── src/              # Components, hooks, services
│   ├── .env.local        # Environment variables
│   └── Dockerfile        # Frontend container (integrated with backend)
├── bff/                  # FastAPI Backend for Frontend
│   ├── server/           # FastAPI application
│   ├── tests/            # Test suite (176 tests, 69% coverage)
│   └── requirements.txt  # Python dependencies
└── Makefile             # Local development utilities
```

## 🔧 Local Development Commands

### Frontend Development
```bash
cd frontend
npm install
npm run dev          # Start Next.js dev server on port 3000
npm run build        # Build for production
npm run test         # Run test suite
npm run lint         # ESLint checking
npm run type-check   # TypeScript validation
```

### BFF Development
```bash
cd bff
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

### Utility Commands
```bash
make install         # Install all dependencies
make build          # Build frontend
make test           # Run frontend tests
make lint           # Run frontend linting
make clean          # Clean build artifacts
make stop           # Stop local development servers
```

## 🌐 Service Architecture

### Port Configuration (Architecture-Compliant)
- **Frontend**: Port 3000 (Next.js)
- **BFF**: Port 8000 (FastAPI) 
- **Backend**: Port 5000 (Flask - in separate repository)

### Environment Variables
The frontend uses these key environment variables:
```env
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_BFF_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# GitHub OAuth
NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT=http://localhost:3000/(auth)/github/callback

# Development
NEXT_PUBLIC_ENV=development
NODE_ENV=development
```

## 🐳 Docker Integration Notes

### For AI Assistants: Key Points
1. **This repository's docker-compose files are for reference only**
2. **All Docker operations are managed from `/home/tmcfar/dev/pw2`**
3. **The Makefile redirects `make up` and `make dev` to prevent conflicts**
4. **Use local development commands for component-specific work**

### Docker Environment Variables
When running in the backend's fullstack Docker environment:
- Frontend runs on port 3000
- BFF runs on port 8000  
- Service-to-service communication uses Docker service names
- Frontend uses `backend:8000` to reach BFF service
- OAuth redirects use `localhost:3000/(auth)/github/callback`

## 🔐 Authentication Flow

### GitHub OAuth Integration
The frontend implements GitHub OAuth with these components:
- **UserProfile.tsx**: GitHub connection UI
- **UserProfileImplementation.tsx**: Alternative implementation
- **app/(auth)/github/callback/page.tsx**: OAuth callback handler

### OAuth Redirect URI
**Correct format**: `http://localhost:3000/(auth)/github/callback`
- Uses Next.js App Router group syntax `(auth)`
- Must match GitHub OAuth app configuration exactly

## 🧪 Testing Strategy

### Frontend Tests
- **Jest + React Testing Library**
- **42 test suites** (fixed from failing state)
- Location: `frontend/src/**/__tests__/`
- Run with: `npm run test`

### BFF Tests  
- **176 comprehensive tests**
- **69% code coverage**
- **pytest + FastAPI TestClient**
- Run with: `cd bff && python -m pytest`

## 🚨 Common Issues & Solutions

### 1. OAuth Infinite Loop
**Problem**: Frontend sends wrong redirect URI
**Solution**: Verify `NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT` environment variable
```typescript
// Correct implementation
const redirectUri = `${window.location.origin}/(auth)/github/callback`;
```

### 2. Docker Port Conflicts
**Problem**: Multiple services trying to use same ports
**Solution**: Use backend's fullstack environment instead of local Docker

### 3. Environment Variables Not Loading
**Problem**: Next.js not picking up .env.local changes
**Solution**: Restart development server completely
```bash
# Stop all processes
make stop
# Restart development
cd frontend && npm run dev
```

### 4. WebSocket Connection Issues
**Problem**: Frontend can't connect to BFF WebSocket
**Solution**: Verify BFF is running and check CORS settings
```bash
# Check BFF status
curl http://localhost:8000/api/health
```

## 📋 Development Workflow

### Making Changes
1. **Frontend Changes**: Work directly in `frontend/` directory
2. **BFF Changes**: Work directly in `bff/` directory  
3. **Fullstack Testing**: Use backend's Docker environment
4. **Component Testing**: Use local development servers

### Environment Setup Priority
1. **Fullstack Development** → Use backend Docker environment
2. **Frontend Only** → Local Next.js development
3. **BFF Only** → Local FastAPI development
4. **Testing** → Both local and Docker environments

### Code Quality
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for Next.js + React
- **Prettier**: Code formatting
- **Jest**: Unit testing
- **Playwright**: E2E testing (future)

## 🔗 Related Documentation

- **Backend Repository**: `/home/tmcfar/dev/pw2`
- **Architecture Overview**: `/home/tmcfar/dev/pw-docs/architecture-overview.md`
- **BFF Documentation**: `./bff/README.md`
- **Frontend Documentation**: `./frontend/README.md`
- **Testing Strategy**: `./frontend/TESTING_STRATEGY.md`

## 📞 Quick Reference

### Start Development
```bash
# Fullstack (recommended)
cd /home/tmcfar/dev/pw2 && make up

# Frontend only
cd frontend && npm run dev

# BFF only  
cd bff && python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

### Health Checks
```bash
curl http://localhost:3000/api/health  # Frontend health
curl http://localhost:8000/api/health  # BFF health
curl http://localhost:5000/api/health  # Backend health (from pw2)
```

### Common Commands
```bash
make help           # Show all available commands
make install        # Install dependencies
make test           # Run tests
make lint           # Check code quality
make clean          # Clean build artifacts
make stop           # Stop development servers
```

---

**Note for AI Assistants**: Always check if changes affect the integrated Docker environment. When in doubt, test both locally and in the backend's fullstack setup.