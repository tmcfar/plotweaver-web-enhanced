# Frontend/BFF Cleanup Instructions for Git-Native Architecture

## Context
You are a senior full-stack developer working on PlotWeaver's web interface. The system uses a git-native architecture where the BFF (Backend-for-Frontend) ONLY reads from git repositories, while the main backend handles all writes. Currently, the BFF is missing critical git read operations and the frontend lacks git-aware components.

## Current State
- Frontend: Next.js 15 with React 19 at `/frontend/`
- BFF: FastAPI server at `/src/` (should be renamed to `/bff/`)
- WebSocket infrastructure working
- Git write operations happen in separate backend (pw2)
- No git read operations in BFF
- No webhook handler for git sync

## Architecture Flow to Implement
```
Frontend → BFF (git read) → Local Git Repo
Frontend → Backend (git write) → GitHub → Webhook → BFF (git pull) → WebSocket → Frontend
```

## Required BFF Changes

### 1. Create Git Repository Manager

Create `/bff/services/git_manager.py`:

```python
import asyncio
from pathlib import Path
from typing import Dict, List, Optional
import aiofiles
import git
from fastapi import HTTPException

class GitRepoManager:
    def __init__(self, repos_base_path: str = "/home/tmcfar/plotweaver-repos"):
        self.repos_base = Path(repos_base_path)
        self.repos: Dict[str, git.Repo] = {}
    
    def get_repo(self, project_id: str) -> git.Repo:
        """Get or clone repository for project"""
        if project_id not in self.repos:
            repo_path = self.repos_base / project_id
            if repo_path.exists():
                self.repos[project_id] = git.Repo(repo_path)
            else:
                raise HTTPException(404, f"Repository not found for project {project_id}")
        return self.repos[project_id]
    
    async def get_file_content(self, project_id: str, file_path: str) -> Dict[str, any]:
        """Read file content from git"""
        repo = self.get_repo(project_id)
        full_path = Path(repo.working_dir) / file_path
        
        if not full_path.exists():
            raise HTTPException(404, f"File not found: {file_path}")
        
        async with aiofiles.open(full_path, 'r') as f:
            content = await f.read()
        
        # Get git info
        last_commit = next(repo.iter_commits(paths=file_path, max_count=1))
        
        return {
            "content": content,
            "path": file_path,
            "last_commit": {
                "sha": last_commit.hexsha,
                "message": last_commit.message,
                "author": str(last_commit.author),
                "timestamp": last_commit.committed_datetime.isoformat()
            }
        }
    
    async def get_tree(self, project_id: str, path: str = "") -> List[Dict]:
        """Get directory tree from git"""
        repo = self.get_repo(project_id)
        tree_items = []
        
        base_path = Path(repo.working_dir) / path
        for item in base_path.iterdir():
            tree_items.append({
                "name": item.name,
                "path": str(item.relative_to(repo.working_dir)),
                "type": "directory" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else None
            })
        
        return tree_items
    
    async def pull_latest(self, project_id: str) -> Dict[str, any]:
        """Pull latest changes from remote"""
        repo = self.get_repo(project_id)
        origin = repo.remote('origin')
        
        # Fetch and get diff
        fetch_info = origin.fetch()
        
        # Pull changes
        origin.pull()
        
        return {
            "status": "success",
            "updated_files": [item.a_path for item in repo.index.diff(None)]
        }
```

### 2. Add Git API Endpoints

Add to `/src/server/main.py`:

```python
from fastapi import APIRouter
from .services.git_manager import GitRepoManager

git_router = APIRouter(prefix="/api/git")
git_manager = GitRepoManager()

@git_router.get("/content/{project_id}/{file_path:path}")
async def get_file_content(project_id: str, file_path: str):
    """Get file content from git repository"""
    return await git_manager.get_file_content(project_id, file_path)

@git_router.get("/tree/{project_id}")
async def get_project_tree(project_id: str, path: str = ""):
    """Get directory tree from git repository"""
    return await git_manager.get_tree(project_id, path)

@git_router.get("/diff/{project_id}/{base_ref}/{head_ref}")
async def get_diff(project_id: str, base_ref: str, head_ref: str = "HEAD"):
    """Get diff between two refs"""
    # Implementation here

@git_router.get("/history/{project_id}/{file_path:path}")
async def get_file_history(project_id: str, file_path: str):
    """Get commit history for a file"""
    # Implementation here

app.include_router(git_router)
```

### 3. Implement Webhook Handler

Add webhook endpoint:

```python
@app.post("/api/webhooks/github")
async def handle_webhook(request: Request):
    """Handle GitHub webhook to trigger git pull"""
    payload = await request.json()
    project_id = payload.get("project_id")
    
    if not project_id:
        raise HTTPException(400, "Missing project_id")
    
    # Pull latest changes
    result = await git_manager.pull_latest(project_id)
    
    # Broadcast update via WebSocket
    await websocket_manager.broadcast({
        "type": "git_update",
        "project_id": project_id,
        "updated_files": result["updated_files"]
    })
    
    return {"status": "ok"}
```

### 4. Add Caching Layer

```python
from aiocache import Cache
from aiocache.serializers import JsonSerializer

cache = Cache(Cache.REDIS, endpoint="localhost", port=6379, serializer=JsonSerializer())

class CachedGitManager(GitRepoManager):
    async def get_file_content(self, project_id: str, file_path: str) -> Dict:
        cache_key = f"git:content:{project_id}:{file_path}"
        
        # Try cache first
        cached = await cache.get(cache_key)
        if cached:
            return cached
        
        # Get from git
        content = await super().get_file_content(project_id, file_path)
        
        # Cache for 5 minutes
        await cache.set(cache_key, content, ttl=300)
        
        return content
    
    async def invalidate_cache(self, project_id: str, files: List[str]):
        """Invalidate cache after git pull"""
        for file_path in files:
            await cache.delete(f"git:content:{project_id}:{file_path}")
```

## Required Frontend Changes

### 1. Create Git-Aware File Tree Component

Create `/frontend/src/components/git/GitFileTree.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gitApi } from '@/lib/api/git';
import { FileIcon, FolderIcon, GitCommitIcon } from '@/components/icons';

interface GitFileTreeProps {
  projectId: string;
  onFileSelect: (path: string) => void;
}

export function GitFileTree({ projectId, onFileSelect }: GitFileTreeProps) {
  const { data: tree, isLoading } = useQuery({
    queryKey: ['git', 'tree', projectId],
    queryFn: () => gitApi.getTree(projectId),
    refetchInterval: 30000, // Poll every 30s
  });

  const renderItem = (item: TreeItem) => {
    const Icon = item.type === 'directory' ? FolderIcon : FileIcon;
    
    return (
      <div 
        key={item.path}
        className="flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer"
        onClick={() => item.type === 'file' && onFileSelect(item.path)}
      >
        <Icon className="w-4 h-4" />
        <span className="text-sm">{item.name}</span>
        {item.lastCommit && (
          <GitCommitIcon className="w-3 h-3 text-gray-500 ml-auto" />
        )}
      </div>
    );
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="git-file-tree">
      {tree?.map(renderItem)}
    </div>
  );
}
```

### 2. Create Git API Client

Create `/frontend/src/lib/api/git.ts`:

```typescript
import { apiClient } from './client';

export const gitApi = {
  getContent: async (projectId: string, path: string) => {
    const response = await apiClient.get(`/api/git/content/${projectId}/${path}`);
    return response.data;
  },
  
  getTree: async (projectId: string, path: string = '') => {
    const response = await apiClient.get(`/api/git/tree/${projectId}`, {
      params: { path }
    });
    return response.data;
  },
  
  getDiff: async (projectId: string, baseRef: string, headRef: string = 'HEAD') => {
    const response = await apiClient.get(`/api/git/diff/${projectId}/${baseRef}/${headRef}`);
    return response.data;
  },
  
  getHistory: async (projectId: string, path: string) => {
    const response = await apiClient.get(`/api/git/history/${projectId}/${path}`);
    return response.data;
  }
};
```

### 3. Add WebSocket Git Events

Update `/frontend/src/hooks/useWebSocket.ts`:

```typescript
export function useWebSocket(projectId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${projectId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'git_update') {
        // Invalidate affected queries
        queryClient.invalidateQueries(['git', 'tree', projectId]);
        
        // Invalidate specific file content
        data.updated_files?.forEach((path: string) => {
          queryClient.invalidateQueries(['git', 'content', projectId, path]);
        });
        
        // Show notification
        toast.info('Project updated from git');
      }
    };
    
    return () => ws.close();
  }, [projectId, queryClient]);
}
```

### 4. Create Optimistic Update Hook

```typescript
export function useOptimisticGitFile(projectId: string, path: string) {
  const queryClient = useQueryClient();
  const [localContent, setLocalContent] = useState<string | null>(null);
  
  const { data: remoteContent } = useQuery({
    queryKey: ['git', 'content', projectId, path],
    queryFn: () => gitApi.getContent(projectId, path),
  });
  
  const updateContent = useCallback((newContent: string) => {
    setLocalContent(newContent);
    
    // Optimistically update cache
    queryClient.setQueryData(
      ['git', 'content', projectId, path],
      (old: any) => ({ ...old, content: newContent, isDirty: true })
    );
  }, [queryClient, projectId, path]);
  
  return {
    content: localContent ?? remoteContent?.content,
    isDirty: localContent !== null,
    updateContent,
    remoteContent: remoteContent?.content
  };
}
```

## Directory Structure Cleanup

### Move files to proper locations:
```bash
# In pw-web directory:
mv src/ bff/
mv requirements.txt bff/
mv venv/ bff/
mv package.json frontend/
mv package-lock.json frontend/
mv node_modules/ frontend/
```

### Update imports after restructuring:
```typescript
// Update all imports from '/src/' to '/bff/'
// Update package.json scripts to use correct paths
```

## Testing Checklist

1. [ ] BFF can read files from git repositories
2. [ ] Frontend displays git file tree correctly
3. [ ] Webhook triggers git pull in BFF
4. [ ] WebSocket broadcasts git updates to frontend
5. [ ] Cache invalidates after git pulls
6. [ ] Optimistic updates work without conflicts
7. [ ] Error handling for missing repos/files

## Environment Variables

### BFF (.env):
```
REPOS_BASE_PATH=/home/tmcfar/plotweaver-repos
REDIS_URL=redis://localhost:6379
BACKEND_WEBHOOK_SECRET=your-secret
```

### Frontend (.env.local):
```
NEXT_PUBLIC_BFF_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Implementation Priority

1. **Day 1**: Create GitRepoManager and basic endpoints
2. **Day 2**: Add webhook handler and WebSocket events  
3. **Day 3**: Implement frontend git components
4. **Day 4**: Add caching layer
5. **Day 5**: Testing and optimization

Remember: BFF ONLY reads from git. All writes go through the main backend.
