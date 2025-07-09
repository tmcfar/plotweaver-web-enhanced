import json
import asyncio
from datetime import UTC, datetime
from typing import Any, Dict, List, Optional

from fastapi import (
    FastAPI,
    WebSocket,
    HTTPException,
    WebSocketDisconnect,
    Query,
    Request,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from bff.preview.sanitizer import sanitize_html
from bff.auth.jwt_auth import websocket_auth_manager
from bff.auth.rate_limiter import rate_limiter
from .constants import MAX_CONNECTIONS, MAX_MESSAGE_SIZE, HEARTBEAT_TIMEOUT
from .bounded_collections import BoundedDict, BoundedSet
from .worldbuilding_endpoints import router as worldbuilding_router
from .feedback_endpoints import router as feedback_router
from bff.services.git_manager import GitRepoManager

app = FastAPI(title="PlotWeaver Web Enhanced")

# Initialize Git manager
git_manager = GitRepoManager()

# Include routers
app.include_router(worldbuilding_router)
app.include_router(feedback_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EnhancedConnectionManager:
    async def _periodic_cleanup(self):
        while True:
            await asyncio.sleep(HEARTBEAT_TIMEOUT * 2)
            now = datetime.now(UTC)
            disconnected = []
            for client_id, presence in self.user_presence.items():
                if (
                    now - presence["last_seen"]
                ).total_seconds() > HEARTBEAT_TIMEOUT * 2:
                    disconnected.append(client_id)
            for client_id in disconnected:
                self.disconnect(client_id)

    def __init__(self):
        # Use bounded collections to prevent memory leaks
        self.active_connections: BoundedDict[str, WebSocket] = BoundedDict(
            MAX_CONNECTIONS, ttl_seconds=3600
        )
        self.project_subscribers: BoundedDict[str, BoundedSet[str]] = BoundedDict(
            1000, ttl_seconds=7200
        )
        self.user_presence: BoundedDict[str, Dict[str, Any]] = BoundedDict(
            MAX_CONNECTIONS, ttl_seconds=1800
        )
        self.heartbeat_intervals: BoundedDict[str, asyncio.Task] = BoundedDict(
            MAX_CONNECTIONS
        )
        self._cleanup_task: Optional[asyncio.Task] = None

    def _ensure_cleanup_task(self):
        """Ensure the cleanup task is running."""
        if self._cleanup_task is None or self._cleanup_task.done():
            try:
                self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
            except RuntimeError:
                # No event loop running, task will be created later
                pass

    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        """Accept a new WebSocket connection and initialize client state.

        Args:
            websocket: The WebSocket connection to accept
            client_id: Unique identifier for the client

        Raises:
            WebSocketDisconnect: If max connections reached
        """
        self._ensure_cleanup_task()  # Ensure cleanup task is running
        if len(self.active_connections) >= MAX_CONNECTIONS:
            await websocket.close(code=1013, reason="Maximum connections reached")
            return
        await websocket.accept()
        self.active_connections[client_id] = websocket

        # Initialize user presence
        self.user_presence[client_id] = {
            "connected_at": datetime.now(UTC),
            "last_seen": datetime.now(UTC),
            "status": "active",
        }

        # Start heartbeat
        self.heartbeat_intervals[client_id] = asyncio.create_task(
            self.heartbeat_loop(client_id)
        )

    def disconnect(self, client_id: str) -> None:
        """Disconnect a client and clean up all associated state.

        Args:
            client_id: The ID of the client to disconnect
        """
        if client_id in self.active_connections:
            del self.active_connections[client_id]

        # Stop heartbeat
        if client_id in self.heartbeat_intervals:
            self.heartbeat_intervals[client_id].cancel()
            del self.heartbeat_intervals[client_id]

        # Remove from all project subscriptions
        for project_id in list(self.project_subscribers.keys()):
            if project_id in self.project_subscribers:
                self.project_subscribers[project_id].discard(client_id)

        # Remove from presence
        if client_id in self.user_presence:
            del self.user_presence[client_id]

    async def subscribe_to_project(self, client_id: str, project_id: str) -> None:
        """Subscribe a client to receive updates for a specific project.

        Args:
            client_id: The ID of the client subscribing
            project_id: The ID of the project to subscribe to
        """
        if project_id not in self.project_subscribers:
            self.project_subscribers[project_id] = BoundedSet(
                100
            )  # Max 100 subscribers per project
        self.project_subscribers[project_id].add(client_id)

        # Update presence
        if client_id not in self.user_presence:
            self.user_presence[client_id] = {}
        self.user_presence[client_id].update(
            {
                "project_id": project_id,
                "last_seen": datetime.now(UTC),
                "status": "active",
            }
        )

    async def heartbeat_loop(self, client_id: str) -> None:
        """Send periodic heartbeat to keep connection alive.

        Args:
            client_id: The ID of the client to send heartbeats to

        The loop continues until the client disconnects or an error occurs.
        """
        try:
            while client_id in self.active_connections:
                await asyncio.sleep(HEARTBEAT_TIMEOUT)
                if client_id in self.active_connections:
                    await self.send_personal_message(
                        {
                            "channel": "heartbeat",
                            "data": {"timestamp": datetime.now(UTC).isoformat()},
                        },
                        client_id,
                    )
        except asyncio.CancelledError:
            pass  # Normal cancellation on disconnect
        except Exception as e:
            print(f"Heartbeat error for {client_id}: {e}")
            self.disconnect(client_id)

    async def send_personal_message(
        self, message: Dict[str, Any], client_id: str
    ) -> None:
        """Send a message to a specific client.

        Args:
            message: The message to send
            client_id: The ID of the client to send to

        Raises:
            TypeError: If message is not a dict
            WebSocketDisconnect: If client disconnects during send

        If the client is no longer connected, they will be disconnected.
        """
        if not isinstance(message, dict):
            raise TypeError("Message must be a dictionary")

        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]

            # Check message size
            message_size = len(str(message))
            if message_size > MAX_MESSAGE_SIZE:
                await websocket.close(code=1009, reason="Message too large")
                self.disconnect(client_id)
                return

            # Check rate limit
            can_send, rate_limit_msg = rate_limiter.check_message_rate(client_id)
            if not can_send:
                error_message = {
                    "channel": "error",
                    "data": {"message": rate_limit_msg, "code": "RATE_LIMITED"},
                }
                await websocket.send_json(error_message)
                return

            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Failed to send message to {client_id}: {e}")
                self.disconnect(client_id)

    async def broadcast_to_project(
        self,
        message: Dict[str, Any],
        project_id: str,
        exclude_client: Optional[str] = None,
    ) -> None:
        """Broadcast a message to all clients subscribed to a project.

        Args:
            message: The message to broadcast
            project_id: The ID of the project to broadcast to
            exclude_client: Optional client ID to exclude from broadcast

        Any clients that fail to receive the message will be disconnected.
        """
        if project_id in self.project_subscribers:
            disconnected_clients = []
            for client_id in self.project_subscribers[project_id]:
                if client_id == exclude_client:
                    continue

                if client_id in self.active_connections:
                    try:
                        websocket = self.active_connections[client_id]
                        await websocket.send_json(message)
                    except Exception as e:
                        print(f"Broadcast error to {client_id}: {e}")
                        disconnected_clients.append(client_id)

            # Clean up disconnected clients
            for client_id in disconnected_clients:
                self.disconnect(client_id)

    def update_presence(self, client_id: str) -> None:
        """Update user's last seen timestamp.

        Args:
            client_id: The ID of the client to update
        """
        if client_id in self.user_presence:
            self.user_presence[client_id]["last_seen"] = datetime.now(UTC)

    def get_connection_stats(self) -> Dict[str, Any]:
        """Get statistics about current connections.

        Returns:
            Dict containing total_connections, active_projects, and uptime_seconds
        """
        active_projects = set()
        for presence in self.user_presence.values():
            if "project_id" in presence:
                active_projects.add(presence["project_id"])

        if not self.user_presence:
            return {"total_connections": 0, "active_projects": 0, "uptime_seconds": 0}

        oldest_connection = list(self.user_presence.values())[0]
        connected_at = oldest_connection.get("connected_at", datetime.now(UTC))
        uptime = (datetime.now(UTC) - connected_at).total_seconds()

        return {
            "total_connections": len(self.active_connections),
            "active_projects": len(active_projects),
            "uptime_seconds": uptime,
        }

    async def unsubscribe_from_project(self, client_id: str, project_id: str) -> None:
        """Unsubscribe a user from project updates.

        Args:
            client_id: The ID of the client to unsubscribe
            project_id: The ID of the project to unsubscribe from
        """
        if project_id in self.project_subscribers:
            self.project_subscribers[project_id].discard(client_id)
            if client_id in self.user_presence:
                self.user_presence[client_id].pop("project_id", None)

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Broadcast message to all connected clients.

        Args:
            message: The message to broadcast to all clients

        Any clients that fail to receive the message will be disconnected.
        """
        disconnected_clients = []
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Broadcast error to {client_id}: {e}")
                disconnected_clients.append(client_id)

        # Clean up disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)


manager = EnhancedConnectionManager()


# Enhanced Models
class ComponentLock(BaseModel):
    id: str
    componentId: str
    level: str  # 'soft' | 'hard' | 'frozen'
    type: str  # 'personal' | 'editorial' | 'collaborative'
    reason: str
    lockedBy: str
    lockedAt: datetime
    sharedWith: List[str] = []
    canOverride: bool = False


class LockConflict(BaseModel):
    id: str
    componentId: str
    type: str
    description: str
    currentState: Dict[str, Any]
    conflictingState: Dict[str, Any]
    priority: str
    affectedUsers: List[str]
    createdAt: datetime


class ConflictResolution(BaseModel):
    type: str
    reason: str
    customState: Optional[Dict[str, Any]] = None


class BulkLockOperation(BaseModel):
    type: str  # 'lock' | 'unlock' | 'change_level'
    componentIds: List[str]
    lockLevel: Optional[str] = None
    reason: str


# Enhanced in-memory storage
project_locks: Dict[str, Dict[str, ComponentLock]] = {}
project_conflicts: Dict[str, List[LockConflict]] = {}
lock_history: Dict[str, List[Dict[str, Any]]] = {}


# Preview state (existing)
class PreviewState:
    def __init__(self) -> None:
        self.current_html: str = ""
        self.screenshot_base64: str | None = None
        self.last_update: datetime = datetime.now(UTC)
        self.metadata: dict[str, Any] = {}


preview_state = PreviewState()


class PreviewUpdate(BaseModel):
    html: str
    screenshot: str | None = None
    metadata: dict[str, Any] | None = None


@app.get("/")
async def root() -> dict[str, Any]:
    return {
        "message": "PlotWeaver Web API Enhanced",
        "version": "2.0.0",
        "features": ["enhanced-websockets", "optimistic-locks", "conflict-resolution"],
        "active_connections": len(manager.active_connections),
    }


@app.get("/api/health")
async def enhanced_health_check() -> dict[str, Any]:
    return {
        "status": "healthy",
        "service": "plotweaver-web-enhanced",
        "websocket_connections": len(manager.active_connections),
        "total_locks": sum(len(locks) for locks in project_locks.values()),
        "total_conflicts": sum(
            len(conflicts) for conflicts in project_conflicts.values()
        ),
    }


# Preview endpoints (existing)
@app.post("/api/preview/update")
async def update_preview(update: PreviewUpdate) -> dict[str, Any]:
    preview_state.current_html = sanitize_html(update.html) if update.html else ""
    preview_state.screenshot_base64 = update.screenshot
    preview_state.last_update = datetime.now(UTC)
    if update.metadata:
        preview_state.metadata = update.metadata
    return {"status": "updated", "timestamp": preview_state.last_update.isoformat()}


@app.get("/api/preview/current")
async def get_current_preview() -> dict[str, Any]:
    return {
        "html": preview_state.current_html,
        "screenshot": preview_state.screenshot_base64,
        "last_update": preview_state.last_update.isoformat(),
        "metadata": preview_state.metadata,
        "has_content": bool(
            preview_state.current_html or preview_state.screenshot_base64
        ),
    }


@app.get("/api/preview/screenshot")
async def get_screenshot() -> dict[str, str]:
    if not preview_state.screenshot_base64:
        raise HTTPException(status_code=404, detail="No screenshot available")
    return {
        "screenshot": preview_state.screenshot_base64,
        "timestamp": preview_state.last_update.isoformat(),
    }


# Enhanced lock management endpoints
@app.get("/api/projects/{project_id}/locks")
async def get_project_locks(project_id: str) -> Dict[str, Any]:
    locks_dict = {
        cid: lock.dict() for cid, lock in project_locks.get(project_id, {}).items()
    }
    return {
        "locks": locks_dict,
        "timestamp": datetime.now(UTC).isoformat(),
        "count": len(locks_dict),
    }


@app.put("/api/projects/{project_id}/locks/{component_id}")
async def update_component_lock(
    project_id: str, component_id: str, lock: ComponentLock
):
    if project_id not in project_locks:
        project_locks[project_id] = {}

    project_locks[project_id][component_id] = lock

    # Add to audit trail
    if project_id not in lock_history:
        lock_history[project_id] = []
    lock_history[project_id].append(
        {
            "action": "lock_updated",
            "componentId": component_id,
            "lock": lock.dict(),
            "timestamp": datetime.now(UTC).isoformat(),
            "user": lock.lockedBy,
        }
    )

    # Broadcast update
    await manager.broadcast_to_project(
        {
            "channel": f"locks:{project_id}",
            "data": {"componentId": component_id, "lock": lock.dict()},
        },
        project_id,
    )

    return {"status": "updated", "timestamp": datetime.now(UTC).isoformat()}


@app.post("/api/projects/{project_id}/locks/bulk")
async def bulk_update_locks(project_id: str, request: Dict[str, Any]):
    operations: List[BulkLockOperation] = [
        BulkLockOperation(**op) for op in request.get("operations", [])
    ]

    if project_id not in project_locks:
        project_locks[project_id] = {}

    updated_components = []
    for operation in operations:
        for component_id in operation.componentIds:
            if operation.type == "lock" and operation.lockLevel:
                lock = ComponentLock(
                    id=f"bulk-lock-{datetime.now().timestamp()}-{component_id}",
                    componentId=component_id,
                    level=operation.lockLevel,
                    type="personal",
                    reason=operation.reason,
                    lockedBy="current-user",
                    lockedAt=datetime.now(UTC),
                    canOverride=True,
                )
                project_locks[project_id][component_id] = lock
                updated_components.append(component_id)
            elif operation.type == "unlock":
                if component_id in project_locks[project_id]:
                    del project_locks[project_id][component_id]
                    updated_components.append(component_id)

    # Broadcast bulk update
    await manager.broadcast_to_project(
        {
            "channel": f"locks:{project_id}",
            "data": {"bulk_update": True, "affected_components": updated_components},
        },
        project_id,
    )

    return {"status": "bulk_updated", "affected_components": updated_components}


@app.get("/api/projects/{project_id}/conflicts")
async def get_project_conflicts(project_id: str) -> List[LockConflict]:
    return project_conflicts.get(project_id, [])


@app.post("/api/projects/{project_id}/conflicts/{conflict_id}/resolve")
async def resolve_conflict(
    project_id: str, conflict_id: str, resolution: ConflictResolution
):
    if project_id in project_conflicts:
        project_conflicts[project_id] = [
            c for c in project_conflicts[project_id] if c.id != conflict_id
        ]

        await manager.broadcast_to_project(
            {
                "channel": f"conflicts:{project_id}",
                "data": {
                    "conflictId": conflict_id,
                    "resolution": resolution.dict(),
                    "status": "resolved",
                },
            },
            project_id,
        )

    return {"status": "resolved"}


@app.get("/api/projects/{project_id}/locks/audit")
async def get_audit_trail(project_id: str) -> List[Dict[str, Any]]:
    return lock_history.get(project_id, [])


@app.post("/api/projects/{project_id}/locks/check-conflicts")
async def check_lock_conflicts(project_id: str, request: Dict[str, Any]):
    """Check for potential lock conflicts before applying."""
    components = request.get("components", [])

    try:
        conflicts = []
        for component_id in components:
            # Check if component is already locked
            if component_id in project_locks.get(project_id, {}):
                existing_lock = project_locks[project_id][component_id]
                conflicts.append(
                    {
                        "component_id": component_id,
                        "conflict_type": "already_locked",
                        "existing_lock": existing_lock.dict(),
                        "can_override": existing_lock.canOverride
                        and existing_lock.level != "frozen",
                    }
                )

        return {
            "success": True,
            "data": {"conflicts": conflicts, "can_proceed": len(conflicts) == 0},
            "timestamp": datetime.now(UTC).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Mode-set endpoints
@app.get("/api/user/mode-set")
async def get_user_mode_set():
    return {
        "currentModeSet": "professional-writer",
        "preferences": {},
        "lastChanged": datetime.now().isoformat(),
    }


@app.post("/api/user/mode-set")
async def set_user_mode_set(mode_set_data: Dict[str, Any]):
    mode_set_id = mode_set_data.get("modeSetId")
    print(f"Setting user mode-set to: {mode_set_id}")
    return {"status": "updated", "modeSetId": mode_set_id}


# Git API endpoints
@app.get("/api/git/content/{project_id}/{file_path:path}")
async def get_file_content(project_id: str, file_path: str):
    """Get file content from git repository"""
    return await git_manager.get_file_content(project_id, file_path)


@app.get("/api/git/tree/{project_id}")
async def get_project_tree(project_id: str, path: str = ""):
    """Get directory tree from git repository"""
    return await git_manager.get_tree(project_id, path)


@app.get("/api/git/diff/{project_id}/{base_ref}/{head_ref}")
async def get_diff(project_id: str, base_ref: str, head_ref: str = "HEAD"):
    """Get diff between two refs"""
    return await git_manager.get_diff(project_id, base_ref, head_ref)


@app.get("/api/git/history/{project_id}/{file_path:path}")
async def get_file_history(project_id: str, file_path: str, limit: int = 10):
    """Get commit history for a file"""
    return await git_manager.get_file_history(project_id, file_path, limit)


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
    await manager.broadcast(
        {
            "type": "git_update",
            "project_id": project_id,
            "updated_files": result["updated_files"],
        }
    )

    return {"status": "ok", "result": result}


@app.websocket("/ws")
async def enhanced_websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT authentication token"),
) -> None:
    # Get client IP for rate limiting
    client_ip = websocket.client.host if websocket.client else "unknown"
    client_id = f"client_{datetime.now().timestamp()}"

    # Check connection rate limit
    can_connect, rate_limit_msg = rate_limiter.check_connection_rate(
        client_ip, client_id
    )
    if not can_connect:
        await websocket.close(code=1013, reason=rate_limit_msg or "Rate limited")
        return

    # Authenticate the connection
    if not await websocket_auth_manager.authenticate_connection(client_id, token):
        await websocket.close(code=4001, reason="Authentication failed")
        rate_limiter.on_disconnect(client_ip, client_id)
        return

    # Start rate limiter cleanup task
    rate_limiter.start_cleanup_task()

    await manager.connect(websocket, client_id)

    try:
        while True:
            data = await websocket.receive_text()
            if len(data) > MAX_MESSAGE_SIZE:
                await websocket.close(code=1009, reason="Message too large")
                return

            # Check message rate limit
            can_send, rate_limit_msg = rate_limiter.check_message_rate(client_id)
            if not can_send:
                await websocket.send_text(
                    json.dumps(
                        {
                            "channel": "error",
                            "data": {"message": rate_limit_msg, "code": "RATE_LIMITED"},
                        }
                    )
                )
                continue

            # Check if token needs refresh
            new_token = await websocket_auth_manager.refresh_connection_token(client_id)
            if new_token:
                await websocket.send_text(
                    json.dumps(
                        {"channel": "token_refresh", "data": {"token": new_token}}
                    )
                )

            try:
                message = json.loads(data)

                if isinstance(message, dict) and "channel" in message:
                    channel = message["channel"]
                    payload = message.get("data", {})

                    if channel.startswith("subscribe:"):
                        project_id = channel.replace("subscribe:", "")
                        await manager.subscribe_to_project(client_id, project_id)
                        await manager.send_personal_message(
                            {
                                "channel": "subscription",
                                "data": {
                                    "project_id": project_id,
                                    "status": "subscribed",
                                },
                            },
                            client_id,
                        )

                    elif channel.startswith("sync-request:"):
                        project_id = channel.replace("sync-request:", "")
                        # Send full sync response
                        locks_data = {
                            cid: lock.model_dump()
                            for cid, lock in project_locks.get(project_id, {}).items()
                        }
                        conflicts_data = [
                            c.model_dump()
                            for c in project_conflicts.get(project_id, [])
                        ]

                        await manager.send_personal_message(
                            {
                                "channel": f"sync-response:{project_id}",
                                "data": {
                                    "locks": locks_data,
                                    "conflicts": conflicts_data,
                                    "timestamp": datetime.now(UTC).isoformat(),
                                },
                            },
                            client_id,
                        )

                    elif channel.startswith("lock-update:"):
                        project_id = channel.replace("lock-update:", "")
                        await manager.broadcast_to_project(
                            {"channel": f"locks:{project_id}", "data": payload},
                            project_id,
                            exclude_client=client_id,
                        )

                    elif channel.startswith("conflict-resolution:"):
                        project_id = channel.replace("conflict-resolution:", "")
                        await manager.broadcast_to_project(
                            {"channel": f"conflicts:{project_id}", "data": payload},
                            project_id,
                            exclude_client=client_id,
                        )

                    else:
                        await manager.send_personal_message(
                            {"channel": "echo", "data": f"Unknown channel: {channel}"},
                            client_id,
                        )

                else:
                    # Handle plain text (backward compatibility)
                    response = f"Echo: {data}"
                    await websocket.send_text(response)

            except json.JSONDecodeError:
                # Handle plain text messages
                response = f"Echo: {data}"
                await websocket.send_text(response)

    except WebSocketDisconnect:
        manager.disconnect(client_id)
        websocket_auth_manager.disconnect_user(client_id)
        rate_limiter.on_disconnect(client_ip, client_id)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
