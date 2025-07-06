"""Tests for the main server application."""

from fastapi.testclient import TestClient
from src.server.main import app

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
