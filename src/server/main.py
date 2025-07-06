from datetime import UTC, datetime
from typing import Any, Dict, List, Set, Optional
import json
import asyncio
from .constants import MAX_CONNECTIONS, MAX_MESSAGE_SIZE, HEARTBEAT_TIMEOUT
from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ..preview.sanitizer import sanitize_html
from ..auth.jwt_auth import websocket_auth_manager
from ..auth.rate_limiter import rate_limiter

app = FastAPI(title="PlotWeaver Web Enhanced")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Enhanced WebSocket Connection Manager
from .bounded_collections import BoundedDict, BoundedSet

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
        self.active_connections: BoundedDict[str, WebSocket] = BoundedDict(MAX_CONNECTIONS, ttl_seconds=3600)
        self.project_subscribers: BoundedDict[str, BoundedSet[str]] = BoundedDict(1000, ttl_seconds=7200)
        self.user_presence: BoundedDict[str, Dict[str, Any]] = BoundedDict(MAX_CONNECTIONS, ttl_seconds=1800)
        self.heartbeat_intervals: BoundedDict[str, asyncio.Task] = BoundedDict(MAX_CONNECTIONS)
        self._cleanup_task: Optional[asyncio.Task] = None

    def _ensure_cleanup_task(self):
        """Ensure the cleanup task is running."""
        if self._cleanup_task is None or self._cleanup_task.done():
            try:
                self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
            except RuntimeError:
                # No event loop running, task will be created later
                pass

    async def connect(self, websocket: WebSocket, client_id: str):
        self._ensure_cleanup_task()  # Ensure cleanup task is running
        if len(self.active_connections) >= MAX_CONNECTIONS:
            await websocket.close(code=1013, reason="Maximum connections reached")
            return
        await websocket.accept()
        self.active_connections[client_id] = websocket

        # Start heartbeat
        self.heartbeat_intervals[client_id] = asyncio.create_task(
            self.heartbeat_loop(client_id)
        )

    def disconnect(self, client_id: str):
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

    def subscribe_to_project(self, client_id: str, project_id: str):
        if project_id not in self.project_subscribers:
            self.project_subscribers[project_id] = BoundedSet(100)  # Max 100 subscribers per project
        self.project_subscribers[project_id].add(client_id)

        # Update presence
        self.user_presence[client_id] = {
            "project_id": project_id,
            "last_seen": datetime.now(UTC),
            "status": "active",
        }

    async def heartbeat_loop(self, client_id: str):
        """Send periodic heartbeat to keep connection alive"""
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
            pass
        except Exception as e:
            print(f"Heartbeat error for {client_id}: {e}")
            self.disconnect(client_id)

    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            try:
                websocket = self.active_connections[client_id]
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                print(f"Failed to send message to {client_id}: {e}")
                self.disconnect(client_id)

    async def broadcast_to_project(
        self, message: dict, project_id: str, exclude_client: Optional[str] = None
    ):
        if project_id in self.project_subscribers:
            disconnected_clients = []
            for client_id in self.project_subscribers[project_id]:
                if client_id == exclude_client:
                    continue

                if client_id in self.active_connections:
                    try:
                        websocket = self.active_connections[client_id]
                        await websocket.send_text(json.dumps(message))
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


@app.websocket("/ws")
async def enhanced_websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT authentication token")
) -> None:
    # Get client IP for rate limiting
    client_ip = websocket.client.host if websocket.client else "unknown"
    client_id = f"client_{datetime.now().timestamp()}"
    
    # Check connection rate limit
    can_connect, rate_limit_msg = rate_limiter.check_connection_rate(client_ip, client_id)
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
                await websocket.send_text(json.dumps({
                    "channel": "error",
                    "data": {"message": rate_limit_msg, "code": "RATE_LIMITED"}
                }))
                continue
            
            # Check if token needs refresh
            new_token = await websocket_auth_manager.refresh_connection_token(client_id)
            if new_token:
                await websocket.send_text(json.dumps({
                    "channel": "token_refresh",
                    "data": {"token": new_token}
                }))

            try:
                message = json.loads(data)

                if isinstance(message, dict) and "channel" in message:
                    channel = message["channel"]
                    payload = message.get("data", {})

                    if channel.startswith("subscribe:"):
                        project_id = channel.replace("subscribe:", "")
                        manager.subscribe_to_project(client_id, project_id)
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
                            c.model_dump() for c in project_conflicts.get(project_id, [])
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
