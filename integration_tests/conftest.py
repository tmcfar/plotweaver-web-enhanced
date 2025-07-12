"""Pytest configuration and fixtures."""

import asyncio
from datetime import datetime, timedelta, UTC
from typing import Generator

import jwt
import pytest


class TestServer:
    """Test server manager for WebSocket tests."""

    def __init__(self, host: str = "127.0.0.1", port: int = 8001):
        self.host = host
        self.port = port
        self.server = None
        self.thread = None

    def start(self):
        """Mock start the server."""
        pass

    def stop(self):
        """Mock stop the server."""
        pass

    @property
    def websocket_url(self) -> str:
        """Get the WebSocket URL."""
        return f"ws://{self.host}:{self.port}/ws"

    @property
    def base_url(self) -> str:
        """Get the base HTTP URL."""
        return f"http://{self.host}:{self.port}"


@pytest.fixture(scope="session")
def test_server() -> Generator[TestServer, None, None]:
    """Provide a test server for WebSocket tests."""
    server = TestServer()
    server.start()
    yield server
    server.stop()


@pytest.fixture
def mock_client():
    """Provide a mock client for testing."""
    class MockClient:
        def get(self, path):
            return MockResponse(200, {"success": True})
        def post(self, path, json=None):
            return MockResponse(200, {"success": True})
    
    class MockResponse:
        def __init__(self, status_code, data):
            self.status_code = status_code
            self._data = data
        def json(self):
            return self._data
    
    return MockClient()


def generate_test_jwt(user_id: str = "test-user", expires_in_minutes: int = 60) -> str:
    """Generate a test JWT token for authentication."""
    # Use the same secret as in the auth module
    secret = "your-secret-key-change-in-production"  # This should match JWT_SECRET in jwt_auth.py

    payload = {
        "user_id": user_id,
        "username": f"{user_id}-username",
        "email": f"{user_id}@test.com",
        "permissions": ["read", "write", "websocket"],
        "iat": int(datetime.now(UTC).timestamp()),
        "exp": int(
            (datetime.now(UTC) + timedelta(minutes=expires_in_minutes)).timestamp()
        ),
    }

    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def valid_jwt_token() -> str:
    """Provide a valid JWT token for testing."""
    return generate_test_jwt()


@pytest.fixture
def expired_jwt_token() -> str:
    """Provide an expired JWT token for testing."""
    secret = "your-secret-key-change-in-production"

    payload = {
        "user_id": "test-user",
        "username": "test-user-username",
        "email": "test-user@test.com",
        "permissions": ["read", "write"],
        "iat": int((datetime.now(UTC) - timedelta(minutes=120)).timestamp()),
        "exp": int(
            (datetime.now(UTC) - timedelta(minutes=60)).timestamp()
        ),  # Expired 1 hour ago
    }

    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
