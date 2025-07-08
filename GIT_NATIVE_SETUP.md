# Git-Native Frontend/BFF Setup

This document describes the git-native architecture implementation for PlotWeaver's web interface.

## Architecture Overview

```
Frontend → BFF (git read) → Local Git Repo
Frontend → Backend (git write) → GitHub → Webhook → BFF (git pull) → WebSocket → Frontend
```

## Directory Structure

```
pw-web/
├── frontend/                 # Next.js 15 frontend
│   ├── src/
│   │   ├── components/git/   # Git-aware components
│   │   ├── hooks/           # Git WebSocket hooks
│   │   └── lib/api/git.ts   # Git API client
│   └── .env.development     # Frontend config
├── bff/                     # Backend-for-Frontend
│   ├── services/
│   │   └── git_manager.py   # Git repository manager
│   ├── server/
│   │   └── main.py         # API endpoints
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # BFF configuration
└── run_bff.py              # BFF runner script
```

## BFF (Backend-for-Frontend) Features

### GitRepoManager Service
- **Read-only git operations** - No writes to prevent conflicts
- File content retrieval with commit metadata
- Directory tree browsing with git awareness
- Git pull operations with change tracking
- Diff generation between refs
- File history retrieval

### API Endpoints
- `GET /api/git/content/{project_id}/{file_path}` - Get file content
- `GET /api/git/tree/{project_id}` - Get directory tree
- `GET /api/git/diff/{project_id}/{base_ref}/{head_ref}` - Get diff
- `GET /api/git/history/{project_id}/{file_path}` - Get file history
- `POST /api/webhooks/github` - GitHub webhook handler

### WebSocket Integration
- Real-time git update notifications
- Project-based subscriptions
- Cache invalidation on git pulls

## Frontend Features

### GitFileTree Component
- Real-time file tree with git integration
- Expandable directory structure
- File selection and navigation
- Git commit indicators
- Auto-refresh on changes

### Git API Client
- Type-safe interfaces for all git operations
- Error handling and retry logic
- Axios-based HTTP client

### WebSocket Hooks
- `useGitWebSocket` - Subscribe to git updates
- `useOptimisticGitFile` - Optimistic file updates
- React Query integration for caching

## Setup Instructions

### 1. Install BFF Dependencies

```bash
cd bff/
pip install -r requirements.txt
```

### 2. Configure Environment

Copy and customize the environment file:
```bash
cp bff/.env.example bff/.env
```

Edit `bff/.env`:
```env
REPOS_BASE_PATH=/path/to/your/plotweaver-repos
REDIS_URL=redis://localhost:6379
BACKEND_WEBHOOK_SECRET=your-secret-key
```

### 3. Create Repository Directory

```bash
mkdir -p /home/tmcfar/plotweaver-repos
# Clone your project repositories here
```

### 4. Start Services

Start the BFF server:
```bash
python run_bff.py
```

Start the frontend (in another terminal):
```bash
cd frontend/
npm run dev
```

### 5. Configure GitHub Webhooks

Set up webhooks to point to your BFF:
```
URL: http://your-domain:8000/api/webhooks/github
Content-Type: application/json
Events: push, pull_request
```

## Development Workflow

### 1. Git Operations Flow
```
1. User writes → Frontend → Main Backend → GitHub
2. GitHub webhook → BFF git pull → WebSocket broadcast
3. Frontend receives update → Query invalidation → UI refresh
```

### 2. File Editing
```
1. User opens file → GitFileTree selection
2. useOptimisticGitFile hook → Local state + cache
3. User edits → Optimistic updates
4. Save → Main Backend API → Git write operations
```

### 3. Real-time Updates
```
1. Git changes → BFF pulls latest
2. WebSocket broadcast → All connected clients
3. Query invalidation → Fresh data fetch
4. UI updates → Visual notifications
```

## Testing

### Test BFF API
```bash
# Get project tree
curl http://localhost:8000/api/git/tree/your-project-id

# Get file content
curl http://localhost:8000/api/git/content/your-project-id/README.md

# Trigger webhook
curl -X POST http://localhost:8000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -d '{"project_id": "your-project-id"}'
```

### Test WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8000/ws?token=development-token');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

## Troubleshooting

### Common Issues

1. **Repository not found**
   - Ensure `REPOS_BASE_PATH` is correct
   - Check repository exists at the specified path
   - Verify git repository is properly initialized

2. **WebSocket connection fails**
   - Check BFF server is running on port 8000
   - Verify CORS configuration in main.py
   - Check authentication token

3. **Git operations fail**
   - Ensure GitPython is installed
   - Check repository permissions
   - Verify git remote is accessible

### Debug Mode

Enable debug logging in the BFF:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Security Considerations

- BFF performs **read-only** git operations
- All git writes go through main backend
- Authentication required for WebSocket connections
- File path validation prevents directory traversal
- Webhook secret validation for GitHub integration

## Performance Optimizations

- React Query caching with 30-second stale time
- WebSocket connection pooling
- Bounded collections to prevent memory leaks
- Debounced file tree updates
- Lazy loading for large directories

## Future Enhancements

- [ ] Redis caching layer for git operations
- [ ] File content diff visualization
- [ ] Branch switching support
- [ ] Merge conflict resolution UI
- [ ] Git blame integration
- [ ] Search across git history