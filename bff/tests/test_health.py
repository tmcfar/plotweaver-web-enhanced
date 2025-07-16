"""
Health check endpoint tests for FastAPI BFF service.

This module tests the health check endpoints to ensure the service
is responding correctly and providing expected health information.
"""

import pytest
from fastapi.testclient import TestClient
from typing import Dict, Any


@pytest.mark.unit
def test_root_endpoint_status_code(test_client: TestClient) -> None:
    """
    Test that the root endpoint returns a 200 status code.

    This test verifies basic connectivity and that the FastAPI
    application is responding to HTTP requests.

    Args:
        test_client: FastAPI test client from conftest.py fixture
    """
    response = test_client.get("/")
    assert response.status_code == 200


@pytest.mark.unit
def test_root_endpoint_response_structure(test_client: TestClient) -> None:
    """
    Test that the root endpoint returns expected response structure.

    This test verifies that the root endpoint provides the required
    fields for service identification and status information.

    Args:
        test_client: FastAPI test client from conftest.py fixture
    """
    response = test_client.get("/")
    data: Dict[str, Any] = response.json()

    # Check required fields are present
    assert "message" in data
    assert "version" in data
    assert "features" in data
    assert "active_connections" in data

    # Verify field types and values
    assert isinstance(data["message"], str)
    assert data["message"] == "PlotWeaver Web API"
    assert isinstance(data["version"], str)
    assert data["version"] == "2.0.0"
    assert isinstance(data["features"], list)
    assert isinstance(data["active_connections"], int)
    assert data["active_connections"] >= 0


@pytest.mark.unit
def test_root_endpoint_features_content(test_client: TestClient) -> None:
    """
    Test that the root endpoint returns expected features.

    This test verifies that the service advertises the correct
    set of features that it supports.

    Args:
        test_client: FastAPI test client from conftest.py fixture
    """
    response = test_client.get("/")
    data: Dict[str, Any] = response.json()

    expected_features = [
        "enhanced-websockets",
        "optimistic-locks",
        "conflict-resolution",
    ]
    assert data["features"] == expected_features


@pytest.mark.unit
def test_health_endpoint_status_code(test_client: TestClient) -> None:
    """
    Test that the health check endpoint returns a 200 status code.

    This test verifies that the dedicated health endpoint is
    accessible and responding correctly.

    Args:
        test_client: FastAPI test client from conftest.py fixture
    """
    response = test_client.get("/api/health")
    assert response.status_code == 200


@pytest.mark.unit
def test_health_endpoint_response_structure(test_client: TestClient) -> None:
    """
    Test that the health endpoint returns expected response structure.

    This test verifies that the health check endpoint provides
    comprehensive health and operational metrics.

    Args:
        test_client: FastAPI test client from conftest.py fixture
    """
    response = test_client.get("/api/health")
    data: Dict[str, Any] = response.json()

    # Check required fields are present
    assert "status" in data
    assert "service" in data
    assert "websocket_connections" in data
    assert "total_locks" in data
    assert "total_conflicts" in data

    # Verify field types and values
    assert isinstance(data["status"], str)
    assert data["status"] == "healthy"
    assert isinstance(data["service"], str)
    assert data["service"] == "plotweaver-bff"
    assert isinstance(data["websocket_connections"], int)
    assert isinstance(data["total_locks"], int)
    assert isinstance(data["total_conflicts"], int)

    # Verify non-negative values for counters
    assert data["websocket_connections"] >= 0
    assert data["total_locks"] >= 0
    assert data["total_conflicts"] >= 0


@pytest.mark.unit
def test_health_endpoint_content_type(test_client: TestClient) -> None:
    """
    Test that the health endpoint returns JSON content type.

    This test verifies that the health endpoint returns properly
    formatted JSON responses with correct content-type headers.

    Args:
        test_client: FastAPI test client from conftest.py fixture
    """
    response = test_client.get("/api/health")
    assert response.headers["content-type"] == "application/json"


@pytest.mark.integration
def test_health_endpoints_consistency(test_client: TestClient) -> None:
    """
    Test that health endpoints provide consistent connection counts.

    This integration test verifies that both the root and health
    endpoints report the same active connection counts, ensuring
    consistency across different health check interfaces.

    Args:
        test_client: FastAPI test client from conftest.py fixture
    """
    root_response = test_client.get("/")
    health_response = test_client.get("/api/health")

    root_data: Dict[str, Any] = root_response.json()
    health_data: Dict[str, Any] = health_response.json()

    # Both endpoints should report the same connection count
    assert root_data["active_connections"] == health_data["websocket_connections"]
