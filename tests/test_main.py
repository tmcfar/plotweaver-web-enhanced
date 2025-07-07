"""Tests for the main server application."""

import pytest
from datetime import datetime, UTC, timedelta
from unittest import mock
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import WebSocket, WebSocketDisconnect

from src.server.main import app, manager, EnhancedConnectionManager
from src.server.bounded_collections import BoundedDict, BoundedSet

client = TestClient(app)


def test_root_endpoint():
    """Test the root endpoint returns correct response."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "PlotWeaver Web API Enhanced"
    assert "version" in data
    assert "features" in data
    assert "active_connections" in data


def test_health_endpoint():
    """Test the health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
    assert "service" in data
    assert "websocket_connections" in data


def test_openapi_spec():
    """Test that OpenAPI specification is available."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"


class TestEnhancedConnectionManager:
    """Test cases for the EnhancedConnectionManager class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.manager = EnhancedConnectionManager()

    def test_manager_initialization(self):
        """Test that the manager initializes correctly."""
        assert isinstance(self.manager.active_connections, BoundedDict)
        assert isinstance(self.manager.project_subscribers, BoundedDict)
        assert isinstance(self.manager.user_presence, BoundedDict)
        assert len(self.manager.active_connections) == 0
        assert len(self.manager.project_subscribers) == 0
        assert len(self.manager.user_presence) == 0

    @pytest.mark.asyncio
    async def test_connect_user(self):
        """Test connecting a user with WebSocket."""
        # Create mock WebSocket
        mock_websocket = AsyncMock(spec=WebSocket)
        client_id = "test_user_123"

        await self.manager.connect(mock_websocket, client_id)

        # Verify connection was stored
        assert client_id in self.manager.active_connections
        assert self.manager.active_connections[client_id] == mock_websocket
        assert client_id in self.manager.user_presence

        # Check presence data
        presence = self.manager.user_presence[client_id]
        assert "connected_at" in presence
        assert "last_seen" in presence
        assert isinstance(presence["connected_at"], datetime)
        assert isinstance(presence["last_seen"], datetime)

    def test_disconnect_user(self):
        """Test disconnecting a user."""
        # First connect a user
        mock_websocket = AsyncMock(spec=WebSocket)
        client_id = "test_user_456"

        # Manually add to simulate connection
        self.manager.active_connections[client_id] = mock_websocket
        self.manager.user_presence[client_id] = {
            "connected_at": datetime.now(UTC),
            "last_seen": datetime.now(UTC),
        }

        # Now disconnect
        self.manager.disconnect(client_id)

        # Verify cleanup
        assert client_id not in self.manager.active_connections
        assert client_id not in self.manager.user_presence

    def test_get_connection_stats(self):
        """Test getting connection statistics."""
        # Add some mock connections
        for i in range(3):
            client_id = f"user_{i}"
            self.manager.active_connections[client_id] = AsyncMock()
            self.manager.user_presence[client_id] = {
                "connected_at": datetime.now(UTC),
                "last_seen": datetime.now(UTC),
            }

        stats = self.manager.get_connection_stats()

        assert "total_connections" in stats
        assert "active_projects" in stats
        assert "uptime_seconds" in stats
        assert stats["total_connections"] == 3
        assert isinstance(stats["uptime_seconds"], (int, float))

    @pytest.mark.asyncio
    async def test_subscribe_to_project(self):
        """Test subscribing a user to project updates."""
        client_id = "test_user_789"
        project_id = "project_123"

        await self.manager.subscribe_to_project(client_id, project_id)

        # Verify subscription
        assert project_id in self.manager.project_subscribers
        subscribers = self.manager.project_subscribers[project_id]
        assert isinstance(subscribers, BoundedSet)
        assert client_id in subscribers

    @pytest.mark.asyncio
    async def test_unsubscribe_from_project(self):
        """Test unsubscribing a user from project updates."""
        client_id = "test_user_101"
        project_id = "project_456"

        # First subscribe
        await self.manager.subscribe_to_project(client_id, project_id)
        assert client_id in self.manager.project_subscribers[project_id]

        # Then unsubscribe
        await self.manager.unsubscribe_from_project(client_id, project_id)

        # Verify unsubscription
        if project_id in self.manager.project_subscribers:
            assert client_id not in self.manager.project_subscribers[project_id]

    @pytest.mark.asyncio
    async def test_send_personal_message(self):
        """Test sending a personal message to a specific client."""
        mock_websocket = AsyncMock(spec=WebSocket)
        client_id = "test_user_202"
        message = {"type": "personal", "content": "Hello user!"}

        # Add connection
        self.manager.active_connections[client_id] = mock_websocket

        await self.manager.send_personal_message(message, client_id)

        # Verify WebSocket send was called
        mock_websocket.send_json.assert_called_once_with(message)

    @pytest.mark.asyncio
    async def test_send_personal_message_no_connection(self):
        """Test sending message to non-existent connection."""
        message = {"type": "personal", "content": "Hello user!"}
        result = await self.manager.send_personal_message(message, "nonexistent")

        # Should handle gracefully without error
        assert result is None

    @pytest.mark.asyncio
    async def test_broadcast_to_project(self):
        """Test broadcasting a message to project subscribers."""
        project_id = "project_789"
        message = {"type": "project_update", "project_id": project_id}

        # Create mock subscribers
        client_ids = ["user_1", "user_2", "user_3"]
        mock_websockets = {}

        for client_id in client_ids:
            mock_ws = AsyncMock(spec=WebSocket)
            mock_websockets[client_id] = mock_ws
            self.manager.active_connections[client_id] = mock_ws
            await self.manager.subscribe_to_project(client_id, project_id)

        await self.manager.broadcast_to_project(message, project_id)

        # Verify all subscribers received the message
        for client_id in client_ids:
            mock_websockets[client_id].send_json.assert_called_once_with(message)

    @pytest.mark.asyncio
    async def test_broadcast_to_all(self):
        """Test broadcasting a message to all connected clients."""
        message = {"type": "global", "content": "Server announcement"}

        # Create mock connections
        client_ids = ["user_1", "user_2", "user_3"]
        mock_websockets = {}

        for client_id in client_ids:
            mock_ws = AsyncMock(spec=WebSocket)
            mock_websockets[client_id] = mock_ws
            self.manager.active_connections[client_id] = mock_ws

        await self.manager.broadcast(message)

        # Verify all connections received the message
        for client_id in client_ids:
            mock_websockets[client_id].send_json.assert_called_once_with(message)

    def test_update_presence(self):
        """Test updating user presence information."""
        client_id = "test_user_303"

        # Initialize presence
        self.manager.user_presence[client_id] = {
            "connected_at": datetime.now(UTC),
            "last_seen": datetime.now(UTC) - timedelta(minutes=5),
        }

        old_last_seen = self.manager.user_presence[client_id]["last_seen"]

        # Update presence
        self.manager.update_presence(client_id)

        # Verify last_seen was updated
        new_last_seen = self.manager.user_presence[client_id]["last_seen"]
        assert new_last_seen > old_last_seen

    def test_update_presence_no_user(self):
        """Test updating presence for non-existent user."""
        # Should handle gracefully
        self.manager.update_presence("nonexistent_user")
        # No exception should be raised

    @pytest.mark.asyncio
    async def test_disconnect_cleanup(self):
        """Test proper cleanup on client disconnect."""
        client_id = "test_disconnect"
        project_id = "test_project"
        mock_websocket = AsyncMock(spec=WebSocket)

        # Setup initial state
        self.manager.active_connections[client_id] = mock_websocket
        self.manager.user_presence[client_id] = {
            "connected_at": datetime.now(UTC),
            "last_seen": datetime.now(UTC),
            "status": "active",
        }
        self.manager.project_subscribers[project_id] = BoundedSet(100)
        self.manager.project_subscribers[project_id].add(client_id)
        self.manager.heartbeat_intervals[client_id] = AsyncMock()

        # Disconnect client
        self.manager.disconnect(client_id)

        # Verify cleanup
        assert client_id not in self.manager.active_connections
        assert client_id not in self.manager.user_presence
        assert client_id not in self.manager.project_subscribers[project_id]
        assert client_id not in self.manager.heartbeat_intervals

    @pytest.mark.asyncio
    async def test_disconnect_on_failed_message(self):
        """Test disconnect handling when message send fails."""
        client_id = "test_client"
        mock_websocket = AsyncMock(spec=WebSocket)
        mock_websocket.send_json.side_effect = WebSocketDisconnect()

        self.manager.active_connections[client_id] = mock_websocket
        self.manager.user_presence[client_id] = {
            "connected_at": datetime.now(UTC),
            "last_seen": datetime.now(UTC),
        }

        message = {"type": "test", "content": "test message"}
        await self.manager.send_personal_message(message, client_id)

        # Client should be disconnected after failed message
        assert client_id not in self.manager.active_connections
        assert client_id not in self.manager.user_presence

    @pytest.mark.asyncio
    async def test_disconnect_on_connection_lost(self):
        """Test handling of lost connections."""
        client_id = "test_client"
        mock_websocket = AsyncMock(spec=WebSocket)
        mock_websocket.send_json.side_effect = ConnectionResetError()

        self.manager.active_connections[client_id] = mock_websocket
        self.manager.user_presence[client_id] = {
            "connected_at": datetime.now(UTC),
            "last_seen": datetime.now(UTC),
        }

        message = {"type": "test", "content": "test message"}
        await self.manager.send_personal_message(message, client_id)

        # Client should be disconnected after connection lost
        assert client_id not in self.manager.active_connections
        assert client_id not in self.manager.user_presence

    @pytest.mark.asyncio
    async def test_periodic_cleanup_old_connections(self):
        """Test that periodic cleanup removes old connections."""
        client_id = "old_user"

        # Add an old connection
        self.manager.active_connections[client_id] = AsyncMock()
        self.manager.user_presence[client_id] = {
            "connected_at": datetime.now(UTC) - timedelta(hours=2),
            "last_seen": datetime.now(UTC) - timedelta(hours=1),
        }

        # Mock the cleanup method to run once

        async def single_cleanup():
            now = datetime.now(UTC)
            disconnected = []
            for client_id, presence in self.manager.user_presence.items():
                if (now - presence["last_seen"]).total_seconds() > 120:  # 2 minutes
                    disconnected.append(client_id)
            for client_id in disconnected:
                self.manager.disconnect(client_id)

        await single_cleanup()

        # Verify old connection was cleaned up
        assert client_id not in self.manager.active_connections
        assert client_id not in self.manager.user_presence


class TestGlobalManagerInstance:
    """Test the global manager instance."""

    def test_global_manager_exists(self):
        """Test that the global manager instance exists and is correctly typed."""
        assert manager is not None
        assert isinstance(manager, EnhancedConnectionManager)

    def test_manager_singleton_behavior(self):
        """Test that the same manager instance is used throughout the application."""
        from src.server.main import manager as manager2

        assert manager is manager2


class TestWebSocketMessageHandling:
    """Test cases for WebSocket message handling."""

    def setup_method(self):
        """Set up test fixtures."""
        self.manager = EnhancedConnectionManager()

    @pytest.mark.asyncio
    async def test_message_validation(self):
        """Test WebSocket message validation."""
        client_id = "test_client"
        mock_websocket = AsyncMock(spec=WebSocket)
        self.manager.active_connections[client_id] = mock_websocket

        # Test valid message format
        valid_message = {"channel": "test", "data": {"content": "test message"}}
        await self.manager.send_personal_message(valid_message, client_id)
        mock_websocket.send_json.assert_called_once_with(valid_message)

        # Test invalid message format
        mock_websocket.reset_mock()
        invalid_message = "not a dict"
        with pytest.raises(TypeError):
            await self.manager.send_personal_message(invalid_message, client_id)  # type: ignore
        mock_websocket.send_json.assert_not_called()

    @pytest.mark.asyncio
    async def test_message_size_limit(self):
        """Test message size limit enforcement."""
        from src.server.constants import MAX_MESSAGE_SIZE

        client_id = "test_client"
        mock_websocket = AsyncMock(spec=WebSocket)
        mock_websocket.close = AsyncMock()

        # Initialize connection
        await self.manager.connect(mock_websocket, client_id)

        # Create oversized message
        big_message = {"type": "test", "data": "a" * MAX_MESSAGE_SIZE}

        # Test receiving oversized message
        await self.manager.send_personal_message(big_message, client_id)
        mock_websocket.close.assert_called_once_with(
            code=1009,  # Message too big
            reason="Message too large",
        )

    @pytest.mark.asyncio
    async def test_message_rate_limiting(self):
        """Test message rate limiting."""
        client_id = "test_client"
        mock_websocket = AsyncMock(spec=WebSocket)
        self.manager.active_connections[client_id] = mock_websocket

        # Mock rate limiter
        from src.auth.rate_limiter import rate_limiter

        rate_limiter.check_message_rate = MagicMock()

        # First call allowed
        rate_limiter.check_message_rate.return_value = (True, None)
        message = {"channel": "test", "data": {"id": 1}}
        await self.manager.send_personal_message(message, client_id)
        mock_websocket.send_json.assert_called_with(message)

        # Second call rate limited
        mock_websocket.reset_mock()
        rate_limiter.check_message_rate.return_value = (False, "Rate limited")
        message = {"channel": "test", "data": {"id": 2}}
        await self.manager.send_personal_message(message, client_id)
        mock_websocket.send_json.assert_called_once_with(
            {
                "channel": "error",
                "data": {"message": "Rate limited", "code": "RATE_LIMITED"},
            }
        )

    @pytest.mark.asyncio
    async def test_heartbeat_loop(self):
        """Test heartbeat loop functionality."""
        client_id = "test_client"
        mock_websocket = AsyncMock(spec=WebSocket)

        # Setup connection
        await self.manager.connect(mock_websocket, client_id)

        # Mock heartbeat interval and sleep
        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            # Force one heartbeat cycle
            await self.manager.heartbeat_loop(client_id)

            # Verify heartbeat message sent
            mock_websocket.send_json.assert_called_with(
                {
                    "channel": "heartbeat",
                    "data": {"timestamp": mock.ANY},  # Timestamp will vary
                }
            )

            # Verify sleep duration
            mock_sleep.assert_called_once_with(mock.ANY)  # HEARTBEAT_TIMEOUT value

    @pytest.mark.asyncio
    async def test_heartbeat_disconnection(self):
        """Test heartbeat handles disconnection correctly."""
        client_id = "test_client"
        mock_websocket = AsyncMock(spec=WebSocket)
        mock_websocket.send_json.side_effect = WebSocketDisconnect()

        # Setup connection
        await self.manager.connect(mock_websocket, client_id)

        # Run heartbeat loop
        await self.manager.heartbeat_loop(client_id)

        # Verify client was disconnected
        assert client_id not in self.manager.active_connections
        assert client_id not in self.manager.heartbeat_intervals


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
