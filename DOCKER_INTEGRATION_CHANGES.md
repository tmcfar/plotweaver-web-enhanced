# Docker Integration Changes Summary

## 🔄 What Changed

The PlotWeaver Web repository (`pw-web`) has been integrated into the backend's fullstack Docker environment to provide a unified development experience.

## ❌ Disabled Commands

The following commands in this repository now redirect to the backend:

### Makefile Changes
```bash
# These commands now echo: "This command only works in the backend."
make up         # Redirects to backend
make dev        # Redirects to backend

# These Docker commands have been completely removed:
make docker-up
make docker-dev  
make docker-build
make docker-down
make docker-logs
make docker-clean
```

### Docker Compose Files
- `docker-compose.yml` - **Still present** (for reference and backend integration)
- `docker-compose.dev.yml` - **Still present** (for reference and backend integration)
- Files are used by backend's fullstack setup, not executed locally

## ✅ New Development Workflow

### Primary Development (Fullstack)
```bash
# Go to the backend repository
cd /home/tmcfar/dev/pw2

# Start the complete environment (Frontend + BFF + Backend)
make up
# OR
make ddev
```

### Component Development (Local)
```bash
# Frontend only
cd /home/tmcfar/dev/pw-web/frontend
npm run dev

# BFF only  
cd /home/tmcfar/dev/pw-web/bff
python -m uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

## 🏗️ Architecture Integration

### Service Communication
When running in fullstack Docker environment:
- **Frontend** (`localhost:3000`) → **BFF** (`backend:8000`) → **Backend** (`backend:5000`)
- Services use Docker service names for internal communication
- External access uses localhost ports

### Environment Variables
Frontend environment variables updated for Docker networking:
```env
# Docker service communication
NEXT_PUBLIC_API_URL=http://backend:8000
NEXT_PUBLIC_BFF_URL=http://backend:8000
NEXT_PUBLIC_BACKEND_URL=http://backend:5000

# External OAuth redirects still use localhost
NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT=http://localhost:3000/(auth)/github/callback
```

## 📋 Benefits of Integration

### ✅ Advantages
1. **Unified Development**: Single command starts entire stack
2. **Consistent Environment**: Same setup across all developers
3. **Service Discovery**: Automatic Docker networking
4. **Port Management**: No conflicts between repositories
5. **Easier Testing**: Full integration testing in one environment

### ⚠️ Important Notes
1. **Local Docker commands disabled** to prevent conflicts
2. **Component development still possible** with local servers
3. **Documentation updated** across all README files
4. **Makefile redirects** guide developers to correct setup

## 🔧 What's Still Available Locally

### Working Commands
```bash
# Installation and setup
make install        # Install all dependencies
make clean          # Clean build artifacts
make stop           # Stop local development servers

# Frontend development
make build          # Build frontend
make test           # Run frontend tests  
make lint           # Run frontend linting

# Individual component commands
make dev-frontend   # Start only frontend
make dev-bff        # Start only BFF
```

### Health Checks
```bash
# Verify services are running
curl http://localhost:3000/api/health  # Frontend
curl http://localhost:8000/api/health  # BFF
curl http://localhost:5000/api/health  # Backend (from pw2)
```

## 📚 Updated Documentation

### Files Updated
- ✅ **README.md** - Updated Quick Start section
- ✅ **frontend/README.md** - Added fullstack development section
- ✅ **bff/README.md** - Added Docker integration notes
- ✅ **CLAUDE.md** - New AI assistant development guide
- ✅ **Makefile** - Disabled Docker commands, added redirects

### Key Documentation Points
1. **Primary development**: Use backend's `make up`
2. **Component development**: Local servers still work
3. **Docker networking**: Service names vs localhost
4. **OAuth configuration**: Correct redirect URI format
5. **Port architecture**: 3000 (Frontend), 8000 (BFF), 5000 (Backend)

## 🚨 Troubleshooting

### Common Issues
1. **"Make up doesn't work"** → Run from `/home/tmcfar/dev/pw2`
2. **Port conflicts** → Use `make stop` to clean up local processes
3. **Environment variables not loading** → Restart development servers
4. **Docker networking issues** → Use backend's Docker environment

### Getting Help
- Check `CLAUDE.md` for detailed development guidelines
- Verify service health with curl commands
- Use backend's integrated logging: `cd /home/tmcfar/dev/pw2 && make logs`

---

**Summary**: The pw-web repository is now a component of the backend's fullstack environment. Use the backend for full development, use local commands for component development.