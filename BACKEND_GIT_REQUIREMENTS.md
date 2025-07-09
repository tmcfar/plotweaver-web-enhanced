# Backend Git Integration Requirements

## Overview

The frontend git integration is complete, but the backend needs significant enhancements to support the full feature set. This document outlines the required backend changes.

## Current Backend State

### ✅ **Existing Features**
- **Read-only git operations** (content, tree, history, diff, status, branches)
- **JWT authentication** with token refresh and WebSocket support
- **Project management** with git metadata tracking
- **WebSocket real-time updates** for git changes
- **Rate limiting** and security middleware
- **Git repository management** (GitRepoManager, BFFGitManager)
- **Caching system** with TTL-based invalidation

### ❌ **Missing Features**
- **Git write operations** (commit, push, merge)
- **File creation/modification** endpoints
- **Branch management** (create, switch, merge)
- **Conflict resolution** workflows
- **Advanced git operations** (rebase, cherry-pick, tags)

## Required Backend Endpoints

### **1. File Write Operations**

```python
# bff/server/git_endpoints.py

@router.post("/api/git/files/{project_id}")
async def create_file(
    project_id: str,
    file_data: FileCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new file in the git repository."""
    pass

@router.put("/api/git/files/{project_id}/{file_path}")
async def update_file(
    project_id: str,
    file_path: str,
    file_data: FileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing file in the git repository."""
    pass

@router.delete("/api/git/files/{project_id}/{file_path}")
async def delete_file(
    project_id: str,
    file_path: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a file from the git repository."""
    pass
```

### **2. Git Commit Operations**

```python
@router.post("/api/git/commit/{project_id}")
async def create_commit(
    project_id: str,
    commit_data: CommitRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a git commit with staged changes."""
    pass

@router.post("/api/git/stage/{project_id}")
async def stage_files(
    project_id: str,
    stage_data: StageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Stage files for commit."""
    pass

@router.post("/api/git/unstage/{project_id}")
async def unstage_files(
    project_id: str,
    unstage_data: UnstageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Unstage files from the staging area."""
    pass
```

### **3. Branch Management**

```python
@router.post("/api/git/branches/{project_id}")
async def create_branch(
    project_id: str,
    branch_data: BranchCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new git branch."""
    pass

@router.put("/api/git/branches/{project_id}/switch")
async def switch_branch(
    project_id: str,
    switch_data: BranchSwitchRequest,
    current_user: dict = Depends(get_current_user)
):
    """Switch to a different branch."""
    pass

@router.post("/api/git/branches/{project_id}/merge")
async def merge_branch(
    project_id: str,
    merge_data: BranchMergeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Merge a branch into the current branch."""
    pass

@router.delete("/api/git/branches/{project_id}/{branch_name}")
async def delete_branch(
    project_id: str,
    branch_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a git branch."""
    pass
```

### **4. Remote Operations**

```python
@router.post("/api/git/push/{project_id}")
async def push_changes(
    project_id: str,
    push_data: PushRequest,
    current_user: dict = Depends(get_current_user)
):
    """Push changes to remote repository."""
    pass

@router.post("/api/git/pull/{project_id}")
async def pull_changes(
    project_id: str,
    pull_data: PullRequest,
    current_user: dict = Depends(get_current_user)
):
    """Pull changes from remote repository."""
    pass

@router.post("/api/git/sync/{project_id}")
async def sync_repository(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Sync repository with remote (pull + push)."""
    pass
```

## Required Data Models

### **1. Request/Response Models**

```python
# bff/models/git_models.py

from pydantic import BaseModel
from typing import List, Optional

class FileCreateRequest(BaseModel):
    path: str
    content: str
    encoding: str = "utf-8"

class FileUpdateRequest(BaseModel):
    content: str
    encoding: str = "utf-8"

class CommitRequest(BaseModel):
    message: str
    author_name: str
    author_email: str
    files: List[str] = []  # Empty means commit all staged files

class StageRequest(BaseModel):
    files: List[str]

class UnstageRequest(BaseModel):
    files: List[str]

class BranchCreateRequest(BaseModel):
    name: str
    source_branch: Optional[str] = None

class BranchSwitchRequest(BaseModel):
    branch_name: str
    create_if_missing: bool = False

class BranchMergeRequest(BaseModel):
    source_branch: str
    target_branch: str
    message: Optional[str] = None

class PushRequest(BaseModel):
    branch: Optional[str] = None
    force: bool = False
    remote: str = "origin"

class PullRequest(BaseModel):
    branch: Optional[str] = None
    remote: str = "origin"
```

### **2. Response Models**

```python
class GitOperationResponse(BaseModel):
    success: bool
    message: str
    operation_id: Optional[str] = None
    files_affected: List[str] = []

class CommitResponse(GitOperationResponse):
    commit_hash: str
    author: str
    timestamp: str

class BranchResponse(GitOperationResponse):
    branch_name: str
    is_current: bool

class ConflictResponse(BaseModel):
    has_conflicts: bool
    conflicted_files: List[str] = []
    resolution_required: bool = False
```

## Enhanced Git Manager

### **1. Extended GitRepoManager**

```python
# bff/services/enhanced_git_manager.py

import git
from typing import List, Dict, Optional
from pathlib import Path

class EnhancedGitRepoManager:
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)
        self.repo = git.Repo(repo_path)
    
    # File Operations
    async def create_file(self, file_path: str, content: str, encoding: str = "utf-8") -> bool:
        """Create a new file in the repository."""
        full_path = self.repo_path / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(full_path, 'w', encoding=encoding) as f:
            f.write(content)
        
        return True
    
    async def update_file(self, file_path: str, content: str, encoding: str = "utf-8") -> bool:
        """Update an existing file in the repository."""
        full_path = self.repo_path / file_path
        
        if not full_path.exists():
            raise FileNotFoundError(f"File {file_path} not found")
        
        with open(full_path, 'w', encoding=encoding) as f:
            f.write(content)
        
        return True
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete a file from the repository."""
        full_path = self.repo_path / file_path
        
        if not full_path.exists():
            raise FileNotFoundError(f"File {file_path} not found")
        
        full_path.unlink()
        return True
    
    # Staging Operations
    async def stage_files(self, files: List[str]) -> bool:
        """Stage files for commit."""
        self.repo.index.add(files)
        return True
    
    async def unstage_files(self, files: List[str]) -> bool:
        """Unstage files from the staging area."""
        self.repo.index.reset(paths=files)
        return True
    
    # Commit Operations
    async def create_commit(
        self, 
        message: str, 
        author_name: str, 
        author_email: str,
        files: Optional[List[str]] = None
    ) -> str:
        """Create a git commit."""
        if files:
            await self.stage_files(files)
        
        actor = git.Actor(author_name, author_email)
        commit = self.repo.index.commit(message, author=actor, committer=actor)
        
        return commit.hexsha
    
    # Branch Operations
    async def create_branch(self, name: str, source_branch: Optional[str] = None) -> bool:
        """Create a new branch."""
        if source_branch:
            source = self.repo.heads[source_branch]
            new_branch = self.repo.create_head(name, source)
        else:
            new_branch = self.repo.create_head(name)
        
        return True
    
    async def switch_branch(self, branch_name: str, create_if_missing: bool = False) -> bool:
        """Switch to a different branch."""
        try:
            branch = self.repo.heads[branch_name]
        except IndexError:
            if create_if_missing:
                branch = self.repo.create_head(branch_name)
            else:
                raise ValueError(f"Branch {branch_name} not found")
        
        branch.checkout()
        return True
    
    async def merge_branch(
        self, 
        source_branch: str, 
        target_branch: str, 
        message: Optional[str] = None
    ) -> bool:
        """Merge a branch into target branch."""
        # Switch to target branch
        await self.switch_branch(target_branch)
        
        # Get source branch
        source = self.repo.heads[source_branch]
        
        # Perform merge
        merge_msg = message or f"Merge branch '{source_branch}' into '{target_branch}'"
        self.repo.git.merge(source, m=merge_msg)
        
        return True
    
    async def delete_branch(self, branch_name: str, force: bool = False) -> bool:
        """Delete a git branch."""
        if branch_name == self.repo.active_branch.name:
            raise ValueError("Cannot delete current branch")
        
        branch = self.repo.heads[branch_name]
        self.repo.delete_head(branch, force=force)
        
        return True
    
    # Remote Operations
    async def push_changes(
        self, 
        branch: Optional[str] = None, 
        remote: str = "origin", 
        force: bool = False
    ) -> bool:
        """Push changes to remote repository."""
        origin = self.repo.remotes[remote]
        
        if branch:
            origin.push(branch, force=force)
        else:
            origin.push(force=force)
        
        return True
    
    async def pull_changes(
        self, 
        branch: Optional[str] = None, 
        remote: str = "origin"
    ) -> bool:
        """Pull changes from remote repository."""
        origin = self.repo.remotes[remote]
        
        if branch:
            origin.pull(branch)
        else:
            origin.pull()
        
        return True
    
    # Conflict Detection
    async def check_conflicts(self) -> Dict[str, List[str]]:
        """Check for merge conflicts."""
        conflicts = []
        
        # Check for conflicted files
        try:
            conflicted_files = self.repo.git.diff('--name-only', '--diff-filter=U').splitlines()
            conflicts.extend(conflicted_files)
        except git.GitCommandError:
            pass
        
        return {
            "has_conflicts": len(conflicts) > 0,
            "conflicted_files": conflicts
        }
```

## WebSocket Enhancements

### **1. Enhanced Real-time Updates**

```python
# bff/server/git_websocket.py

class GitWebSocketManager:
    def __init__(self, connection_manager):
        self.connection_manager = connection_manager
    
    async def broadcast_git_update(
        self, 
        project_id: str, 
        operation: str, 
        files: List[str], 
        user_id: str
    ):
        """Broadcast git operation to all project subscribers."""
        message = {
            "type": "git_update",
            "project_id": project_id,
            "operation": operation,
            "updated_files": files,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.connection_manager.broadcast_to_project(project_id, message)
    
    async def broadcast_file_change(
        self, 
        project_id: str, 
        file_path: str, 
        change_type: str,
        user_id: str
    ):
        """Broadcast specific file changes."""
        message = {
            "type": "file_changed",
            "project_id": project_id,
            "file_path": file_path,
            "change_type": change_type,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.connection_manager.broadcast_to_project(project_id, message)
    
    async def broadcast_branch_change(
        self, 
        project_id: str, 
        branch_name: str, 
        operation: str,
        user_id: str
    ):
        """Broadcast branch operations."""
        message = {
            "type": "branch_changed",
            "project_id": project_id,
            "branch_name": branch_name,
            "operation": operation,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.connection_manager.broadcast_to_project(project_id, message)
```

## Database Schema Extensions

### **1. Git Operation Audit Log**

```sql
-- migrations/add_git_audit_log.sql

CREATE TABLE git_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id UUID NOT NULL REFERENCES users(id),
    operation_type VARCHAR(50) NOT NULL, -- commit, push, pull, merge, etc.
    operation_data JSONB NOT NULL,
    files_affected TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT
);

CREATE INDEX idx_git_operations_project_id ON git_operations(project_id);
CREATE INDEX idx_git_operations_user_id ON git_operations(user_id);
CREATE INDEX idx_git_operations_created_at ON git_operations(created_at);
```

### **2. Project Git Configuration**

```sql
-- migrations/add_project_git_config.sql

ALTER TABLE projects ADD COLUMN git_config JSONB DEFAULT '{}';

-- Example git_config structure:
-- {
--   "default_branch": "main",
--   "auto_push": true,
--   "auto_pull": false,
--   "require_review": false,
--   "collaborators": ["user1", "user2"],
--   "protected_branches": ["main", "develop"]
-- }
```

## Security and Permissions

### **1. Git Operation Permissions**

```python
# bff/auth/git_permissions.py

from enum import Enum
from typing import List

class GitPermission(str, Enum):
    READ = "git:read"
    WRITE = "git:write"
    ADMIN = "git:admin"
    MERGE = "git:merge"
    DELETE = "git:delete"

async def check_git_permission(
    user: dict,
    project_id: str,
    permission: GitPermission
) -> bool:
    """Check if user has specific git permission for project."""
    
    # Admin users have all permissions
    if user.get("is_admin"):
        return True
    
    # Check project membership and role
    membership = await get_project_membership(user["id"], project_id)
    if not membership:
        return False
    
    # Permission mapping based on role
    role_permissions = {
        "owner": [GitPermission.READ, GitPermission.WRITE, GitPermission.ADMIN, GitPermission.MERGE, GitPermission.DELETE],
        "editor": [GitPermission.READ, GitPermission.WRITE, GitPermission.MERGE],
        "contributor": [GitPermission.READ, GitPermission.WRITE],
        "viewer": [GitPermission.READ]
    }
    
    allowed_permissions = role_permissions.get(membership.role, [])
    return permission in allowed_permissions

def require_git_permission(permission: GitPermission):
    """Decorator to require specific git permission."""
    async def permission_checker(
        project_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        has_permission = await check_git_permission(
            current_user, 
            project_id, 
            permission
        )
        
        if not has_permission:
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions: {permission} required"
            )
        
        return current_user
    
    return Depends(permission_checker)
```

## Implementation Priority

### **Phase 1: Essential Write Operations** (2-3 weeks)
1. File create/update/delete endpoints
2. Basic commit operations
3. WebSocket updates for write operations
4. Permission system integration

### **Phase 2: Branch Management** (1-2 weeks)
1. Branch create/switch/delete operations
2. Basic merge functionality
3. Conflict detection

### **Phase 3: Remote Operations** (1-2 weeks)
1. Push/pull functionality
2. Sync operations
3. Remote repository management

### **Phase 4: Advanced Features** (2-3 weeks)
1. Merge conflict resolution
2. Advanced git operations
3. Audit logging and monitoring
4. Performance optimization

## Testing Requirements

### **1. Unit Tests**
- Git operation functions
- Permission checking
- WebSocket message broadcasting

### **2. Integration Tests**
- End-to-end git workflows
- Multi-user collaboration scenarios
- Error handling and recovery

### **3. Performance Tests**
- Large file operations
- Concurrent user scenarios
- WebSocket load testing

This implementation plan provides a complete backend foundation to support the frontend git integration with proper security, real-time updates, and collaborative features.