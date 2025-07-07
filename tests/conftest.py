"""Pytest configuration and fixtures."""

import asyncio
import threading
import time
from datetime import datetime, timedelta, UTC
from typing import Generator

import jwt
import pytest
import uvicorn
from fastapi.testclient import TestClient

from src.server.main import app


class TestServer:
    """Test server manager for WebSocket tests."""

    def __init__(self, host: str = "127.0.0.1", port: int = 8001):
        self.host = host
        self.port = port
        self.server = None
        self.thread = None

    def start(self):
        """Start the server in a background thread."""

        def run_server():
            config = uvicorn.Config(
                app=app,
                host=self.host,
                port=self.port,
                log_level="error",  # Reduce logging during tests
                access_log=False,
            )
            self.server = uvicorn.Server(config)
            asyncio.run(self.server.serve())

        self.thread = threading.Thread(target=run_server, daemon=True)
        self.thread.start()

        # Wait for server to be ready
        max_retries = 30
        for _ in range(max_retries):
            try:
                import requests

                response = requests.get(
                    f"http://{self.host}:{self.port}/api/health", timeout=1
                )
                if response.status_code == 200:
                    break
            except Exception:
                pass
            time.sleep(0.1)
        else:
            raise RuntimeError("Test server failed to start")

    def stop(self):
        """Stop the server."""
        if self.server:
            self.server.should_exit = True

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
def client() -> TestClient:
    """Provide a test client."""
    return TestClient(app)


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
