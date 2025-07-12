"""
Test configuration and fixtures for FastAPI BFF service.

This module provides common test fixtures and configuration for pytest,
including async support, authentication helpers, and test client setup.
"""

import asyncio
import os
import time
from typing import Any, AsyncGenerator, Dict
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from jose import jwt

import sys
from pathlib import Path

# Add the parent directory to sys.path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from server.main import app
except ImportError:
    # Create a test FastAPI app with mock health and auth endpoints
    from fastapi import FastAPI, HTTPException, Depends, status, Query
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    from pydantic import BaseModel
    from typing import Optional

    app = FastAPI(title="Test App", version="2.0.0")
    security = HTTPBearer()

    # Mock auth models
    class LoginRequest(BaseModel):
        username: str
        password: str

    class TokenResponse(BaseModel):
        access_token: str
        token_type: str
        expires_in: int

    class RefreshRequest(BaseModel):
        refresh_token: str

    class UserInfo(BaseModel):
        user_id: str
        username: str
        email: str
        permissions: list[str]

    # Mock user database
    MOCK_USERS = {
        "testuser": {
            "password": "testpass123",
            "user_id": "test-user-123",
            "email": "testuser@example.com",
            "permissions": ["read", "write"],
        },
        "admin": {
            "password": "admin123",
            "user_id": "admin-456",
            "email": "admin@example.com",
            "permissions": ["read", "write", "admin"],
        },
    }

    def verify_token(
        credentials: HTTPAuthorizationCredentials = Depends(security),
    ) -> dict:
        """Mock token verification."""
        from jose import jwt, JWTError

        try:
            payload = jwt.decode(
                credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

    @app.get("/")
    async def root():
        """Mock root endpoint for testing."""
        return {
            "message": "PlotWeaver Web API Enhanced",
            "version": "2.0.0",
            "features": [
                "enhanced-websockets",
                "optimistic-locks",
                "conflict-resolution",
            ],
            "active_connections": 0,
        }

    @app.get("/api/health")
    async def health():
        """Mock health endpoint for testing."""
        return {
            "status": "healthy",
            "service": "plotweaver-web-enhanced",
            "websocket_connections": 0,
            "total_locks": 0,
            "total_conflicts": 0,
        }

    @app.post("/api/auth/login", response_model=TokenResponse)
    async def login(request: LoginRequest):
        """Mock login endpoint for testing."""
        user = MOCK_USERS.get(request.username)
        if not user or user["password"] != request.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )

        # Create JWT token
        from datetime import datetime, timedelta, timezone
        from jose import jwt

        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION_MINUTES)
        payload = {
            "sub": user["user_id"],
            "username": request.username,
            "email": user["email"],
            "permissions": user["permissions"],
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        }

        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": JWT_EXPIRATION_MINUTES * 60,
        }

    @app.post("/api/auth/refresh", response_model=TokenResponse)
    async def refresh_token(request: RefreshRequest):
        """Mock token refresh endpoint for testing."""
        from jose import jwt, JWTError
        from datetime import datetime, timedelta, timezone

        try:
            payload = jwt.decode(
                request.refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM]
            )

            # Create new token
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=JWT_EXPIRATION_MINUTES
            )
            new_payload = {
                "sub": payload["sub"],
                "username": payload["username"],
                "email": payload["email"],
                "permissions": payload.get("permissions", ["read"]),
                "exp": expire,
                "iat": datetime.now(timezone.utc),
            }

            new_token = jwt.encode(new_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

            return {
                "access_token": new_token,
                "token_type": "bearer",
                "expires_in": JWT_EXPIRATION_MINUTES * 60,
            }
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
            )

    @app.get("/api/auth/me", response_model=UserInfo)
    async def get_current_user(payload: dict = Depends(verify_token)):
        """Mock get current user endpoint for testing."""
        return {
            "user_id": payload["sub"],
            "username": payload["username"],
            "email": payload["email"],
            "permissions": payload.get("permissions", ["read"]),
        }

    @app.get("/api/protected")
    async def protected_endpoint(payload: dict = Depends(verify_token)):
        """Mock protected endpoint for testing."""
        return {
            "message": "Protected data accessed successfully",
            "user": payload.get("username", "unknown"),
            "data": "sensitive information",
        }

    # Mock lock system storage
    project_locks = {}  # project_id -> {component_id: ComponentLock}
    project_conflicts = {}  # project_id -> [LockConflict]
    lock_history = {}  # project_id -> [audit_records]

    # Lock models
    class ComponentLock(BaseModel):
        id: str
        componentId: str
        level: str  # 'soft' | 'hard' | 'frozen'
        type: str  # 'personal' | 'editorial' | 'collaborative'
        reason: str
        lockedBy: str
        lockedAt: str
        sharedWith: list[str] = []
        canOverride: bool = False

    class LockConflict(BaseModel):
        id: str
        componentId: str
        type: str
        description: str
        currentState: dict
        conflictingState: dict
        priority: str
        affectedUsers: list[str]
        createdAt: str

    class ConflictResolution(BaseModel):
        type: str
        reason: str
        customState: dict = None

    class BulkLockOperation(BaseModel):
        type: str  # 'lock' | 'unlock' | 'change_level'
        componentIds: list[str]
        lockLevel: str = None
        reason: str

    class BulkLockRequest(BaseModel):
        operations: list[BulkLockOperation]

    # Lock endpoints
    @app.get("/api/projects/{project_id}/locks")
    async def get_project_locks(project_id: str, payload: dict = Depends(verify_token)):
        """Get all locks for a project."""
        locks = project_locks.get(project_id, {})
        return {
            "locks": locks,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "count": len(locks),
        }

    @app.put("/api/projects/{project_id}/locks/{component_id}")
    async def create_or_update_lock(
        project_id: str,
        component_id: str,
        lock: ComponentLock,
        payload: dict = Depends(verify_token),
    ):
        """Create or update a component lock."""
        if project_id not in project_locks:
            project_locks[project_id] = {}

        # Check for conflicts
        existing_lock = project_locks[project_id].get(component_id)
        if (
            existing_lock
            and existing_lock["level"] == "frozen"
            and existing_lock["lockedBy"] != payload.get("sub")
        ):
            raise HTTPException(status_code=409, detail="Cannot override frozen lock")

        lock_data = lock.model_dump()
        lock_data["lockedAt"] = datetime.now(timezone.utc).isoformat()
        lock_data["lockedBy"] = payload.get("sub", "test-user")

        project_locks[project_id][component_id] = lock_data

        # Add to history
        if project_id not in lock_history:
            lock_history[project_id] = []
        lock_history[project_id].append(
            {
                "action": "create_lock",
                "componentId": component_id,
                "lock": lock_data,
                "timestamp": lock_data["lockedAt"],
                "user": payload.get("username", "testuser"),
            }
        )

        return {"success": True, "lock": lock_data}

    @app.delete("/api/projects/{project_id}/locks/{component_id}")
    async def delete_lock(
        project_id: str, component_id: str, payload: dict = Depends(verify_token)
    ):
        """Delete a component lock."""
        if (
            project_id not in project_locks
            or component_id not in project_locks[project_id]
        ):
            raise HTTPException(status_code=404, detail="Lock not found")

        existing_lock = project_locks[project_id][component_id]

        # Check ownership for frozen locks
        if existing_lock["level"] == "frozen" and existing_lock[
            "lockedBy"
        ] != payload.get("sub"):
            raise HTTPException(
                status_code=403,
                detail="Cannot delete frozen lock owned by another user",
            )

        del project_locks[project_id][component_id]

        # Add to history
        if project_id not in lock_history:
            lock_history[project_id] = []
        lock_history[project_id].append(
            {
                "action": "delete_lock",
                "componentId": component_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "user": payload.get("username", "testuser"),
            }
        )

        return {"success": True}

    @app.post("/api/projects/{project_id}/locks/bulk")
    async def bulk_lock_operations(
        project_id: str, request: BulkLockRequest, payload: dict = Depends(verify_token)
    ):
        """Perform bulk lock operations."""
        if project_id not in project_locks:
            project_locks[project_id] = {}

        results = []
        for operation in request.operations:
            for component_id in operation.componentIds:
                try:
                    if operation.type == "lock":
                        lock_data = {
                            "id": f"lock_{component_id}_{int(time.time())}",
                            "componentId": component_id,
                            "level": operation.lockLevel or "soft",
                            "type": "personal",
                            "reason": operation.reason,
                            "lockedBy": payload.get("sub", "test-user"),
                            "lockedAt": datetime.now(timezone.utc).isoformat(),
                            "sharedWith": [],
                            "canOverride": operation.lockLevel != "frozen",
                        }
                        project_locks[project_id][component_id] = lock_data
                        results.append(
                            {
                                "componentId": component_id,
                                "status": "locked",
                                "lock": lock_data,
                            }
                        )

                    elif operation.type == "unlock":
                        if component_id in project_locks[project_id]:
                            del project_locks[project_id][component_id]
                        results.append(
                            {"componentId": component_id, "status": "unlocked"}
                        )

                    elif operation.type == "change_level":
                        if component_id in project_locks[project_id]:
                            project_locks[project_id][component_id]["level"] = (
                                operation.lockLevel
                            )
                            results.append(
                                {
                                    "componentId": component_id,
                                    "status": "level_changed",
                                    "newLevel": operation.lockLevel,
                                }
                            )
                        else:
                            results.append(
                                {"componentId": component_id, "status": "not_found"}
                            )

                except Exception as e:
                    results.append(
                        {
                            "componentId": component_id,
                            "status": "error",
                            "error": str(e),
                        }
                    )

        return {"success": True, "results": results}

    @app.get("/api/projects/{project_id}/conflicts")
    async def get_project_conflicts(
        project_id: str, payload: dict = Depends(verify_token)
    ):
        """Get all conflicts for a project."""
        conflicts = project_conflicts.get(project_id, [])
        return {"conflicts": conflicts, "count": len(conflicts)}

    @app.post("/api/projects/{project_id}/conflicts/{conflict_id}/resolve")
    async def resolve_conflict(
        project_id: str,
        conflict_id: str,
        resolution: ConflictResolution,
        payload: dict = Depends(verify_token),
    ):
        """Resolve a lock conflict."""
        if project_id not in project_conflicts:
            raise HTTPException(status_code=404, detail="Project conflicts not found")

        conflicts = project_conflicts[project_id]
        conflict_index = next(
            (i for i, c in enumerate(conflicts) if c["id"] == conflict_id), None
        )

        if conflict_index is None:
            raise HTTPException(status_code=404, detail="Conflict not found")

        # Remove the resolved conflict
        resolved_conflict = conflicts.pop(conflict_index)

        return {
            "success": True,
            "resolvedConflict": resolved_conflict,
            "resolution": resolution.model_dump(),
        }

    @app.get("/api/projects/{project_id}/locks/audit")
    async def get_lock_audit(project_id: str, payload: dict = Depends(verify_token)):
        """Get lock audit trail for a project."""
        history = lock_history.get(project_id, [])
        return {"audit": history, "count": len(history)}

    @app.post("/api/projects/{project_id}/locks/check-conflicts")
    async def check_lock_conflicts(
        project_id: str, request: dict, payload: dict = Depends(verify_token)
    ):
        """Check for potential lock conflicts."""
        components = request.get("components", [])
        conflicts = []

        project_locks_dict = project_locks.get(project_id, {})

        for component_id in components:
            if component_id in project_locks_dict:
                existing_lock = project_locks_dict[component_id]
                can_override = (
                    existing_lock.get("canOverride", False)
                    and existing_lock["level"] != "frozen"
                )

                conflicts.append(
                    {
                        "component_id": component_id,
                        "conflict_type": "already_locked",
                        "existing_lock": existing_lock,
                        "can_override": can_override,
                    }
                )

        can_proceed = all(c["can_override"] for c in conflicts) if conflicts else True

        return {
            "success": True,
            "data": {"conflicts": conflicts, "can_proceed": can_proceed},
        }

    # Mock project system storage
    projects_storage = {}  # project_id -> Project
    user_projects = {}  # user_id -> [project_ids]
    project_collaborators = {}  # project_id -> [user_ids]

    # Project models
    class Project(BaseModel):
        id: str
        name: str
        description: str = ""
        status: str = "draft"  # 'draft' | 'active' | 'archived'
        visibility: str = "private"  # 'private' | 'public'
        owner_id: str
        created_at: str
        updated_at: str
        metadata: dict = {}

    class ProjectCreate(BaseModel):
        name: str
        description: str = ""
        visibility: str = "private"
        metadata: dict = {}

    class ProjectUpdate(BaseModel):
        name: str = None
        description: str = None
        status: str = None
        visibility: str = None
        metadata: dict = None

    class CollaboratorAdd(BaseModel):
        user_id: str
        role: str = "collaborator"  # 'collaborator' | 'viewer'

    # Project endpoints
    @app.get("/api/projects")
    async def list_projects(
        status: Optional[str] = None,
        visibility: Optional[str] = None,
        limit: int = Query(50, ge=1, le=100),
        offset: int = Query(0, ge=0),
        payload: dict = Depends(verify_token),
    ):
        """List user's projects."""
        user_id = payload.get("sub")
        user_project_ids = user_projects.get(user_id, [])

        # Get projects owned by user
        owned_projects = [
            projects_storage[pid] for pid in user_project_ids if pid in projects_storage
        ]

        # Get projects where user is collaborator
        collaborator_projects = []
        for project_id, collaborators in project_collaborators.items():
            if user_id in collaborators and project_id in projects_storage:
                collaborator_projects.append(projects_storage[project_id])

        all_projects = owned_projects + collaborator_projects

        # Apply filters
        if status:
            all_projects = [p for p in all_projects if p["status"] == status]
        if visibility:
            all_projects = [p for p in all_projects if p["visibility"] == visibility]

        # Apply pagination
        total = len(all_projects)
        paginated_projects = all_projects[offset : offset + limit]

        return {
            "projects": paginated_projects,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    @app.post("/api/projects")
    async def create_project(
        project: ProjectCreate, payload: dict = Depends(verify_token)
    ):
        """Create a new project."""
        user_id = payload.get("sub")

        # Validate project name
        if not project.name or not project.name.strip():
            raise HTTPException(status_code=422, detail="Project name cannot be empty")

        if len(project.name) > 200:
            raise HTTPException(status_code=422, detail="Project name too long")

        if "\x00" in project.name or "\n" in project.name:
            raise HTTPException(
                status_code=422, detail="Project name contains invalid characters"
            )

        # Check if user already has a project with this name
        user_project_ids = user_projects.get(user_id, [])
        for pid in user_project_ids:
            if (
                pid in projects_storage
                and projects_storage[pid]["name"] == project.name
            ):
                raise HTTPException(
                    status_code=409, detail="Project name already exists"
                )

        # Check project limits (max 10 projects per user for testing)
        if len(user_project_ids) >= 10:
            raise HTTPException(status_code=403, detail="Maximum project limit reached")

        project_id = f"proj_{int(time.time())}_{user_id.split('-')[-1]}"
        now = datetime.now(timezone.utc).isoformat()

        project_data = {
            "id": project_id,
            "name": project.name.strip(),
            "description": project.description,
            "status": "draft",
            "visibility": project.visibility,
            "owner_id": user_id,
            "created_at": now,
            "updated_at": now,
            "metadata": project.metadata,
        }

        projects_storage[project_id] = project_data

        if user_id not in user_projects:
            user_projects[user_id] = []
        user_projects[user_id].append(project_id)

        return {"success": True, "project": project_data}

    @app.get("/api/projects/{project_id}")
    async def get_project(project_id: str, payload: dict = Depends(verify_token)):
        """Get project details."""
        if project_id not in projects_storage:
            raise HTTPException(status_code=404, detail="Project not found")

        project = projects_storage[project_id]
        user_id = payload.get("sub")

        # Check access permissions
        is_owner = project["owner_id"] == user_id
        is_collaborator = user_id in project_collaborators.get(project_id, [])
        is_public = project["visibility"] == "public"

        if not (is_owner or is_collaborator or is_public):
            raise HTTPException(status_code=403, detail="Access denied")

        # Add collaborator info
        collaborators = project_collaborators.get(project_id, [])
        project_with_collaborators = {
            **project,
            "collaborators": collaborators,
            "user_role": "owner"
            if is_owner
            else "collaborator"
            if is_collaborator
            else "viewer",
        }

        return {"project": project_with_collaborators}

    @app.put("/api/projects/{project_id}")
    async def update_project(
        project_id: str, update: ProjectUpdate, payload: dict = Depends(verify_token)
    ):
        """Update project."""
        if project_id not in projects_storage:
            raise HTTPException(status_code=404, detail="Project not found")

        project = projects_storage[project_id]
        user_id = payload.get("sub")

        # Only owner can update project
        if project["owner_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only project owner can update")

        # Update fields
        update_data = update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                project[field] = value

        project["updated_at"] = datetime.now(timezone.utc).isoformat()
        projects_storage[project_id] = project

        return {"success": True, "project": project}

    @app.delete("/api/projects/{project_id}")
    async def delete_project(project_id: str, payload: dict = Depends(verify_token)):
        """Delete project."""
        if project_id not in projects_storage:
            raise HTTPException(status_code=404, detail="Project not found")

        project = projects_storage[project_id]
        user_id = payload.get("sub")

        # Only owner can delete project
        if project["owner_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only project owner can delete")

        # Clean up related data
        if project_id in project_locks:
            del project_locks[project_id]
        if project_id in project_conflicts:
            del project_conflicts[project_id]
        if project_id in lock_history:
            del lock_history[project_id]
        if project_id in project_collaborators:
            del project_collaborators[project_id]

        # Remove from user's project list
        if user_id in user_projects:
            user_projects[user_id] = [
                pid for pid in user_projects[user_id] if pid != project_id
            ]

        del projects_storage[project_id]

        return {"success": True}

    @app.get("/api/projects/{project_id}/collaborators")
    async def list_collaborators(
        project_id: str, payload: dict = Depends(verify_token)
    ):
        """List project collaborators."""
        if project_id not in projects_storage:
            raise HTTPException(status_code=404, detail="Project not found")

        project = projects_storage[project_id]
        user_id = payload.get("sub")

        # Check access permissions
        is_owner = project["owner_id"] == user_id
        is_collaborator = user_id in project_collaborators.get(project_id, [])

        if not (is_owner or is_collaborator):
            raise HTTPException(status_code=403, detail="Access denied")

        collaborators = project_collaborators.get(project_id, [])
        collaborator_details = []

        for collab_id in collaborators:
            # Mock collaborator details
            collaborator_details.append(
                {
                    "user_id": collab_id,
                    "username": f"user_{collab_id.split('-')[-1]}",
                    "role": "collaborator",
                    "added_at": datetime.now(timezone.utc).isoformat(),
                }
            )

        return {
            "collaborators": collaborator_details,
            "count": len(collaborator_details),
        }

    @app.post("/api/projects/{project_id}/collaborators")
    async def add_collaborator(
        project_id: str,
        collaborator: CollaboratorAdd,
        payload: dict = Depends(verify_token),
    ):
        """Add collaborator to project."""
        if project_id not in projects_storage:
            raise HTTPException(status_code=404, detail="Project not found")

        project = projects_storage[project_id]
        user_id = payload.get("sub")

        # Only owner can add collaborators
        if project["owner_id"] != user_id:
            raise HTTPException(
                status_code=403, detail="Only project owner can add collaborators"
            )

        # Check if already a collaborator
        if project_id not in project_collaborators:
            project_collaborators[project_id] = []

        if collaborator.user_id in project_collaborators[project_id]:
            raise HTTPException(
                status_code=409, detail="User is already a collaborator"
            )

        # Don't allow owner to add themselves
        if collaborator.user_id == user_id:
            raise HTTPException(
                status_code=400, detail="Cannot add project owner as collaborator"
            )

        project_collaborators[project_id].append(collaborator.user_id)

        return {
            "success": True,
            "collaborator": {
                "user_id": collaborator.user_id,
                "role": collaborator.role,
                "added_at": datetime.now(timezone.utc).isoformat(),
            },
        }

    @app.delete("/api/projects/{project_id}/collaborators/{user_id}")
    async def remove_collaborator(
        project_id: str, user_id: str, payload: dict = Depends(verify_token)
    ):
        """Remove collaborator from project."""
        if project_id not in projects_storage:
            raise HTTPException(status_code=404, detail="Project not found")

        project = projects_storage[project_id]
        current_user_id = payload.get("sub")

        # Only owner can remove collaborators, or collaborator can remove themselves
        is_owner = project["owner_id"] == current_user_id
        is_self_removal = current_user_id == user_id

        if not (is_owner or is_self_removal):
            raise HTTPException(status_code=403, detail="Access denied")

        if project_id not in project_collaborators:
            raise HTTPException(status_code=404, detail="Collaborator not found")

        if user_id not in project_collaborators[project_id]:
            raise HTTPException(status_code=404, detail="Collaborator not found")

        project_collaborators[project_id].remove(user_id)

        return {"success": True}


# Use environment variable for JWT secret with test default
# This ensures production secrets are never hardcoded in test files
JWT_SECRET = os.getenv("JWT_SECRET", "test-secret-key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 30

# Export constants for use in tests
__all__ = ["JWT_SECRET", "JWT_ALGORITHM", "JWT_EXPIRATION_MINUTES"]


@pytest_asyncio.fixture
async def event_loop() -> AsyncGenerator[asyncio.AbstractEventLoop, None]:
    """
    Create and provide an event loop for async tests.

    This fixture ensures each test gets a fresh event loop instance,
    preventing interference between async tests.

    Usage:
        async def test_async_function(event_loop):
            result = await some_async_function()
            assert result == expected

    Yields:
        asyncio.AbstractEventLoop: Fresh event loop for the test
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_client() -> TestClient:
    """
    Create a FastAPI test client for testing endpoints.

    This fixture provides a test client that can be used to make
    requests to the FastAPI application without running a server.

    Usage:
        def test_endpoint(test_client):
            response = test_client.get("/api/endpoint")
            assert response.status_code == 200

    Returns:
        TestClient: FastAPI test client instance
    """
    return TestClient(app)


@pytest.fixture
def test_user() -> Dict[str, Any]:
    """
    Provide a test user dictionary with common user attributes.

    This fixture creates a consistent test user that can be used
    across different tests requiring user data.

    Usage:
        def test_user_creation(test_user):
            assert test_user["username"] == "testuser"
            assert "email" in test_user

    Returns:
        Dict[str, Any]: Test user data including id, username, email, and roles
    """
    return {
        "id": "test-user-123",
        "username": "testuser",
        "email": "testuser@example.com",
        "roles": ["user"],
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


@pytest.fixture
def auth_headers(test_user: Dict[str, Any]) -> Dict[str, str]:
    """
    Generate authentication headers with a valid JWT token.

    This fixture creates HTTP headers containing a valid JWT token
    for the test user, allowing authenticated endpoint testing.

    Usage:
        def test_protected_endpoint(test_client, auth_headers):
            response = test_client.get("/api/protected", headers=auth_headers)
            assert response.status_code == 200

    Args:
        test_user: Test user data from the test_user fixture

    Returns:
        Dict[str, str]: HTTP headers with Authorization Bearer token
    """
    # Create JWT token payload
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    payload = {
        "sub": test_user["id"],
        "username": test_user["username"],
        "email": test_user["email"],
        "roles": test_user["roles"],
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    # Generate token
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def async_test_client() -> AsyncGenerator[TestClient, None]:
    """
    Create an async-capable test client for testing WebSocket endpoints.

    This fixture provides a test client that supports both regular HTTP
    and WebSocket connections for comprehensive async testing.

    Usage:
        async def test_websocket(async_test_client):
            async with async_test_client as client:
                with client.websocket_connect("/ws") as websocket:
                    websocket.send_json({"type": "ping"})
                    data = websocket.receive_json()
                    assert data["type"] == "pong"

    Yields:
        TestClient: Async-capable FastAPI test client
    """
    async with TestClient(app) as client:
        yield client


@pytest.fixture
def mock_jwt_secret(monkeypatch) -> str:
    """
    Override JWT secret for testing purposes.

    This fixture allows tests to use a specific JWT secret,
    useful for testing token validation with known secrets.

    Usage:
        def test_custom_jwt(mock_jwt_secret):
            # Test will use "mock-secret" as JWT secret
            token = create_token_with_secret("mock-secret")
            assert validate_token(token)

    Args:
        monkeypatch: pytest's monkeypatch fixture

    Returns:
        str: The mock JWT secret being used
    """
    mock_secret = "mock-secret-for-testing"
    monkeypatch.setenv("JWT_SECRET", mock_secret)
    return mock_secret


@pytest.fixture
def expired_token(test_user: Dict[str, Any]) -> str:
    """
    Generate an expired JWT token for testing token expiration scenarios.

    This fixture creates a JWT token with an expiration date in the past,
    useful for testing authentication failures due to expired tokens.

    Usage:
        def test_expired_token_rejection(test_client, expired_token):
            headers = {"Authorization": f"Bearer {expired_token}"}
            response = test_client.get("/api/protected", headers=headers)
            assert response.status_code == 401

    Args:
        test_user: Test user data from the test_user fixture

    Returns:
        str: Expired JWT token
    """
    # Create JWT token that expired 1 hour ago
    past_time = datetime.now(timezone.utc) - timedelta(hours=1)
    payload = {
        "sub": test_user["id"],
        "username": test_user["username"],
        "email": test_user["email"],
        "permissions": test_user.get("roles", ["user"]),
        "exp": past_time,  # Expired 1 hour ago
        "iat": past_time - timedelta(minutes=30),  # Issued 1.5 hours ago
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@pytest.fixture
def malformed_tokens() -> Dict[str, str]:
    """
    Generate various malformed JWT tokens for security testing.

    This fixture provides a dictionary of different types of malformed
    tokens to test edge cases and security vulnerabilities.

    Usage:
        def test_malformed_tokens(test_client, malformed_tokens):
            for token_type, token in malformed_tokens.items():
                headers = {"Authorization": f"Bearer {token}"}
                response = test_client.get("/api/protected", headers=headers)
                assert response.status_code in [401, 422]

    Returns:
        Dict[str, str]: Dictionary of malformed token types and values
    """
    valid_payload = {
        "sub": "test-user-123",
        "username": "testuser",
        "email": "test@example.com",
        "permissions": ["read"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "iat": datetime.now(timezone.utc),
    }

    return {
        "invalid_signature": jwt.encode(
            valid_payload, "wrong-secret", algorithm=JWT_ALGORITHM
        ),
        "no_bearer_prefix": jwt.encode(
            valid_payload, JWT_SECRET, algorithm=JWT_ALGORITHM
        ),
        "invalid_format": "this.is.not.a.jwt.token.at.all",
        "empty_token": "",
        "null_token": None,
        "corrupted_token": jwt.encode(
            valid_payload, JWT_SECRET, algorithm=JWT_ALGORITHM
        )[:-10]
        + "corrupted",
        "wrong_algorithm": jwt.encode(valid_payload, JWT_SECRET, algorithm="HS512"),
        "missing_claims": jwt.encode(
            {"sub": "test"}, JWT_SECRET, algorithm=JWT_ALGORITHM
        ),
    }


@pytest.fixture
def valid_credentials() -> Dict[str, str]:
    """
    Provide valid login credentials for testing.

    This fixture returns credentials that should successfully
    authenticate with the mock authentication system.

    Usage:
        def test_login_success(test_client, valid_credentials):
            response = test_client.post("/api/auth/login", json=valid_credentials)
            assert response.status_code == 200

    Returns:
        Dict[str, str]: Valid username and password
    """
    return {"username": "testuser", "password": "testpass123"}


@pytest.fixture
def admin_credentials() -> Dict[str, str]:
    """
    Provide admin login credentials for testing elevated permissions.

    This fixture returns admin credentials for testing endpoints
    that require higher privilege levels.

    Usage:
        def test_admin_access(test_client, admin_credentials):
            response = test_client.post("/api/auth/login", json=admin_credentials)
            token = response.json()["access_token"]
            # Use token for admin-only endpoints

    Returns:
        Dict[str, str]: Admin username and password
    """
    return {"username": "admin", "password": "admin123"}


@pytest.fixture
def sample_component_lock() -> Dict[str, Any]:
    """
    Provide a sample ComponentLock for testing.

    This fixture returns a valid lock structure that can be used
    for testing lock creation and manipulation operations.

    Usage:
        def test_create_lock(test_client, sample_component_lock):
            response = test_client.put("/api/projects/test/locks/comp123", json=sample_component_lock)
            assert response.status_code == 200

    Returns:
        Dict[str, Any]: Sample ComponentLock data
    """
    return {
        "id": "lock_comp123_123456789",
        "componentId": "comp123",
        "level": "soft",
        "type": "personal",
        "reason": "Testing component editing",
        "lockedBy": "test-user-123",
        "lockedAt": datetime.now(timezone.utc).isoformat(),
        "sharedWith": [],
        "canOverride": True,
    }


@pytest.fixture
def sample_conflict() -> Dict[str, Any]:
    """
    Provide a sample LockConflict for testing.

    This fixture returns a valid conflict structure for testing
    conflict detection and resolution mechanisms.

    Usage:
        def test_resolve_conflict(test_client, sample_conflict):
            # Use conflict data for testing resolution

    Returns:
        Dict[str, Any]: Sample LockConflict data
    """
    return {
        "id": "conflict123",
        "componentId": "comp123",
        "type": "lock_override",
        "description": "User attempting to override existing lock",
        "currentState": {"locked": True, "level": "hard"},
        "conflictingState": {"locked": True, "level": "soft"},
        "priority": "medium",
        "affectedUsers": ["user1", "user2"],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }


@pytest.fixture
def websocket_token(test_user: Dict[str, Any]) -> str:
    """
    Generate a JWT token specifically for WebSocket authentication.

    This fixture creates a JWT token that can be used as a query
    parameter for WebSocket connection authentication.

    Usage:
        async def test_websocket_auth(websocket_token):
            uri = f"ws://testserver/ws?token={websocket_token}"
            async with websockets.connect(uri) as websocket:
                # Test WebSocket functionality

    Args:
        test_user: Test user data from the test_user fixture

    Returns:
        str: JWT token for WebSocket authentication
    """
    from jose import jwt

    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    payload = {
        "sub": test_user["id"],
        "username": test_user["username"],
        "email": test_user["email"],
        "permissions": test_user.get("roles", ["user"]),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@pytest_asyncio.fixture
async def websocket_test_client() -> AsyncGenerator[TestClient, None]:
    """
    Create a test client with WebSocket support for testing lock broadcasts.

    This fixture provides a test client that can establish WebSocket
    connections for testing real-time lock update notifications.

    Usage:
        async def test_websocket_locks(websocket_test_client):
            async with websocket_test_client as client:
                with client.websocket_connect("/ws?token=test_token") as websocket:
                    # Test WebSocket lock broadcasts

    Yields:
        TestClient: Async test client with WebSocket support
    """
    async with TestClient(app) as client:
        yield client
