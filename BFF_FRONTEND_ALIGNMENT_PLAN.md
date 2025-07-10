# BFF & Frontend Architecture Alignment Plan

## Overview
This plan focuses on aligning the pw-web (BFF and Frontend) components with the architecture defined in `/home/tmcfar/dev/pw-docs/architecture-overview.md`.

## Key Architecture Principles to Enforce

### 1. Read/Write Separation
- **BFF**: Only handles READ operations from local git repo
- **Backend**: Handles ALL WRITE operations (commits, pushes, content generation)
- **Frontend**: Routes reads to BFF, writes to Backend

### 2. Service Responsibilities
- **BFF (Port 8000)**: Git reads, WebSocket hub, webhook listener, preview system
- **Backend (Port 5000)**: Content generation, git writes, auth, quality gates, billing

## Required Changes

### 1. Remove Git Write Operations from BFF

**File:** `bff/server/git_write_endpoints.py`
**Action:** DELETE this file entirely

**File:** `bff/server/main.py`
**Action:** Remove git write router registration
```python
# REMOVE THIS LINE:
# app.include_router(git_write.router, prefix="/api/git/write", tags=["git-write"])
```

### 2. Convert Story Generation to Proxy Pattern

**File:** `bff/server/story_endpoints.py`
**Current:** Direct implementation of story generation
**Required:** Convert to proxy pattern

```python
# NEW: story_proxy.py
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import httpx
import os

router = APIRouter()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")

@router.post("/stories/generate")
async def proxy_story_generation(request: Request):
    """Proxy story generation requests to backend"""
    async with httpx.AsyncClient() as client:
        # Forward request to backend
        backend_url = f"{BACKEND_URL}/api/v1/generate/scene"
        
        # Stream response from backend
        async with client.stream(
            "POST",
            backend_url,
            json=await request.json(),
            headers={"Authorization": request.headers.get("Authorization")}
        ) as response:
            return StreamingResponse(
                response.aiter_bytes(),
                media_type="text/event-stream"
            )
```

### 3. Create Write Operation Proxies

**File:** `bff/server/write_proxy.py` (NEW)
```python
from fastapi import APIRouter, Request, HTTPException
import httpx
import os

router = APIRouter()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")

@router.post("/git/commit")
@router.post("/git/push")
@router.post("/git/branch")
@router.put("/git/files/{path:path}")
@router.delete("/git/files/{path:path}")
async def proxy_git_writes(request: Request, path: str = None):
    """Proxy all git write operations to backend"""
    async with httpx.AsyncClient() as client:
        # Construct backend URL
        backend_path = request.url.path.replace("/api", "/api/v1")
        backend_url = f"{BACKEND_URL}{backend_path}"
        
        # Forward request
        response = await client.request(
            method=request.method,
            url=backend_url,
            json=await request.json() if request.method != "GET" else None,
            headers={"Authorization": request.headers.get("Authorization")}
        )
        
        return response.json()
```

### 4. Update BFF Main Router Configuration

**File:** `bff/server/main.py`
```python
# Updated imports
from .git_endpoints import router as git_read_router
from .write_proxy import router as write_proxy_router
from .story_proxy import router as story_proxy_router
# Remove: from .git_write_endpoints import router as git_write_router
# Remove: from .story_endpoints import router as story_router

# Updated router registration
app.include_router(git_read_router, prefix="/api/git", tags=["git-read"])
app.include_router(write_proxy_router, prefix="/api", tags=["write-proxy"])
app.include_router(story_proxy_router, prefix="/api", tags=["story-proxy"])
```

### 5. Frontend API Client Updates

**File:** `frontend/lib/api/git.ts`
```typescript
// Update API endpoints to use correct services
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Read operations (BFF)
export const gitRead = {
  getContent: (path: string) => fetch(`${API_BASE}/api/git/content/${path}`),
  getTree: (project: string) => fetch(`${API_BASE}/api/git/tree/${project}`),
  getDiff: (project: string) => fetch(`${API_BASE}/api/git/diff/${project}`),
};

// Write operations (Backend via BFF proxy)
export const gitWrite = {
  commit: (data: CommitData) => fetch(`${API_BASE}/api/git/commit`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  push: (project: string) => fetch(`${API_BASE}/api/git/push`, {
    method: 'POST',
    body: JSON.stringify({ project }),
  }),
};

// Story generation (Backend via BFF proxy)
export const storyGeneration = {
  generate: (data: GenerationRequest) => fetch(`${API_BASE}/api/stories/generate`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
```

### 6. WebSocket Alignment

**File:** `bff/server/main.py`
Ensure WebSocket only handles:
- Real-time content updates (from git pulls)
- Lock notifications
- User presence
- Generation progress (forwarded from backend)

```python
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Current implementation is mostly correct
    # Ensure it doesn't handle any write operations
    # Only broadcasts changes after backend writes
    pass
```

## Implementation Steps

### Step 1: Create Proxy Infrastructure
1. Create `write_proxy.py` for git write operations
2. Create `story_proxy.py` for story generation
3. Add proxy utility functions for error handling

### Step 2: Remove Direct Write Implementations
1. Delete `git_write_endpoints.py`
2. Remove direct story generation logic from `story_endpoints.py`
3. Update `main.py` router configuration

### Step 3: Update Frontend API Clients
1. Update all API client modules to use correct endpoints
2. Ensure writes go through BFF proxy to backend
3. Maintain reads directly from BFF

### Step 4: Test End-to-End Flows
1. Test read operations (should be unchanged)
2. Test write operations through proxy
3. Test WebSocket updates after writes
4. Test story generation with SSE streaming

## Validation Checklist

- [ ] BFF has NO direct git write operations
- [ ] All writes proxy to backend (port 5000)
- [ ] All reads use local git repo in BFF
- [ ] WebSocket only broadcasts, doesn't write
- [ ] Story generation proxies to backend
- [ ] Frontend uses correct API endpoints
- [ ] Authentication headers properly forwarded
- [ ] Error handling maintained through proxy

## File Changes Summary

### Files to Delete
- `bff/server/git_write_endpoints.py`
- `bff/server/story_endpoints.py` (or convert to proxy)

### Files to Create
- `bff/server/write_proxy.py`
- `bff/server/story_proxy.py`

### Files to Modify
- `bff/server/main.py` - Update router configuration
- `frontend/lib/api/*.ts` - Update API endpoints

This focused plan ensures the BFF and Frontend strictly follow the read/write separation pattern defined in the architecture.