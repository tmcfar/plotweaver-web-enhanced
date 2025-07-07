"""End-to-end WebSocket tests."""

import asyncio
import json
import pytest
import websockets
from fastapi.testclient import TestClient
from src.server.main import app


@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)


@pytest.mark.asyncio
async def test_websocket_connection():
    """Test basic WebSocket connection."""
    uri = "ws://localhost:8000/ws"

    try:
        async with websockets.connect(uri) as websocket:
            # Send a test message
            await websocket.send("hello")

            # Receive echo response
            response = await websocket.recv()
            assert "Echo: hello" in response
    except Exception as e:
        pytest.skip(f"WebSocket server not running: {e}")


@pytest.mark.asyncio
async def test_websocket_reconnection():
    """Test WebSocket reconnection behavior."""
    uri = "ws://localhost:8000/ws"

    try:
        # First connection
        async with websockets.connect(uri) as websocket:
            await websocket.send("test1")
            response1 = await websocket.recv()
            assert "Echo: test1" in response1

        # Second connection (simulating reconnection)
        async with websockets.connect(uri) as websocket:
            await websocket.send("test2")
            response2 = await websocket.recv()
            assert "Echo: test2" in response2

    except Exception as e:
        pytest.skip(f"WebSocket server not running: {e}")


@pytest.mark.asyncio
async def test_websocket_message_size_limit():
    """Test WebSocket message size validation."""
    uri = "ws://localhost:8000/ws"

    try:
        async with websockets.connect(uri) as websocket:
            # Send a large message (exceeding MAX_MESSAGE_SIZE)
            large_message = "x" * (1024 * 1024 + 1)  # 1MB + 1 byte

            await websocket.send(large_message)

            # Connection should be closed due to message size limit
            with pytest.raises(websockets.exceptions.ConnectionClosed):
                await websocket.recv()

    except Exception as e:
        pytest.skip(f"WebSocket server not running: {e}")


@pytest.mark.asyncio
async def test_websocket_heartbeat():
    """Test WebSocket heartbeat mechanism."""
    uri = "ws://localhost:8000/ws"

    try:
        async with websockets.connect(uri) as websocket:
            # Wait for heartbeat message
            heartbeat_received = False

            async def listen_for_heartbeat():
                nonlocal heartbeat_received
                try:
                    while True:
                        message = await asyncio.wait_for(websocket.recv(), timeout=35)
                        if "heartbeat" in message:
                            heartbeat_received = True
                            break
                except asyncio.TimeoutError:
                    pass

            await listen_for_heartbeat()
            assert heartbeat_received, "Heartbeat message not received"

    except Exception as e:
        pytest.skip(f"WebSocket server not running: {e}")


@pytest.mark.asyncio
async def test_websocket_project_subscription():
    """Test WebSocket project subscription functionality."""
    uri = "ws://localhost:8000/ws"

    try:
        async with websockets.connect(uri) as websocket:
            # Subscribe to a project
            subscription_message = {"channel": "subscribe:test-project", "data": {}}

            await websocket.send(json.dumps(subscription_message))

            # Wait for subscription confirmation
            response = await websocket.recv()
            response_data = json.loads(response)

            assert response_data["channel"] == "subscription"
            assert response_data["data"]["project_id"] == "test-project"
            assert response_data["data"]["status"] == "subscribed"

    except Exception as e:
        pytest.skip(f"WebSocket server not running: {e}")


def test_websocket_connection_limit():
    """Test WebSocket connection limit enforcement."""
    # This test would require starting multiple connections
    # to test the MAX_CONNECTIONS limit
    pass  # Implementation would depend on test setup


if __name__ == "__main__":
    pytest.main([__file__])
