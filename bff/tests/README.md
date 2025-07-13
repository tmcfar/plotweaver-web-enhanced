# BFF Test Suite Documentation

## Overview

The BFF (Backend-for-Frontend) test suite is designed to ensure reliability, maintainability, and confidence in our API layer that bridges the frontend and backend services. This comprehensive test suite follows industry best practices while being pragmatic about real-world development needs.

### Purpose and Philosophy

Our testing philosophy emphasizes:
- **Fast Feedback**: Tests should run quickly to support rapid development
- **Clear Failures**: When tests fail, the reason should be immediately obvious
- **Realistic Scenarios**: Tests should reflect actual usage patterns
- **Maintainability**: Tests should be as maintainable as production code
- **Progressive Enhancement**: Start with unit tests, add integration tests as complexity grows

### Test Categories

1. **Unit Tests** (`tests/api/test_*.py`)
   - Test individual endpoints and functions in isolation
   - Mock external dependencies
   - Focus on business logic and edge cases
   - Run in milliseconds

2. **Integration Tests** (`tests/integration/`)
   - Test complete workflows across multiple endpoints
   - Use real or dockerized dependencies when possible
   - Verify system behavior end-to-end
   - May take seconds to run

3. **WebSocket Tests** (`tests/api/test_locks.py`)
   - Test real-time communication
   - Verify connection lifecycle
   - Test message broadcasting and subscriptions
   - Handle connection drops gracefully

### Development Workflow Support

Tests support development by:
- Providing living documentation of API behavior
- Enabling confident refactoring
- Catching regressions early
- Serving as examples for API usage

## Test Structure

```
tests/
├── api/                    # API endpoint tests
│   ├── test_auth.py       # Authentication & authorization
│   ├── test_projects.py   # Project management endpoints
│   ├── test_locks.py      # Lock system & WebSocket tests
│   └── test_*.py          # Other endpoint tests
├── integration/           # End-to-end workflow tests
│   └── test_workflows.py  # Complete user journeys
├── conftest.py           # Shared fixtures and configuration
└── __init__.py           # Package initialization
```

### Directory Organization

#### `tests/api/`
Place unit tests for individual API endpoints here. Each test file should:
- Focus on a single resource or feature area
- Test all HTTP methods (GET, POST, PUT, DELETE)
- Include both success and error cases
- Mock external dependencies

Example structure:
```python
# tests/api/test_documents.py
class TestDocumentsAPI:
    def test_create_document_success(self):
        """Test successful document creation"""
        
    def test_create_document_invalid_data(self):
        """Test document creation with invalid data"""
        
    def test_get_document_not_found(self):
        """Test retrieving non-existent document"""
```

#### `tests/integration/`
Place tests that verify complete workflows here. These tests:
- Cross multiple endpoints
- Test realistic user scenarios
- May use real databases or services
- Verify data consistency across operations

#### `conftest.py`
Contains shared fixtures available to all tests:
- Test client setup
- Authentication helpers
- Database fixtures
- Mock services

## Running Tests

### Basic Commands

```bash
# Run all tests
pytest tests/

# Run with verbose output
pytest tests/ -v

# Run specific test file
pytest tests/api/test_auth.py

# Run specific test
pytest tests/api/test_auth.py::test_login_success

# Run tests matching pattern
pytest tests/ -k "websocket"
```

### Coverage Reports

```bash
# Generate coverage report
pytest tests/ --cov=server --cov-report=term-missing

# Generate HTML coverage report
pytest tests/ --cov=server --cov-report=html
# Open htmlcov/index.html in browser

# Set minimum coverage threshold
pytest tests/ --cov=server --cov-fail-under=80
```

### Development Mode

```bash
# Watch mode - reruns tests on file changes
pytest-watch tests/

# Run tests in parallel (requires pytest-xdist)
pytest tests/ -n auto

# Show print statements and logging
pytest tests/ -s

# Stop on first failure
pytest tests/ -x
```

## Writing Tests

### Test Naming Convention

Follow the pattern: `test_<what>_<condition>_<expected_result>`

```python
def test_create_project_valid_data_returns_201():
    """Good: Clear what, condition, and expectation"""
    
def test_get_user_unauthorized_returns_401():
    """Good: Explicit about authorization state"""
    
def test_websocket_connection_auth_token_expired_closes_with_4001():
    """Good: Specific about WebSocket behavior"""
```

### Common Fixtures

```python
# conftest.py provides these fixtures:

@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)

@pytest.fixture
def auth_headers():
    """Valid authentication headers"""
    token = create_test_token(user_id="test_user")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def db_session():
    """Database session for tests"""
    async with get_test_database() as session:
        yield session
        await session.rollback()
```

### Async Test Patterns

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_async_endpoint():
    """Test async endpoint using httpx"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/async-endpoint")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_websocket_communication():
    """Test WebSocket using async context manager"""
    async with websocket_connect("/ws/test") as websocket:
        await websocket.send_json({"type": "ping"})
        response = await websocket.receive_json()
        assert response["type"] == "pong"
```

### WebSocket Testing

```python
from fastapi.testclient import TestClient

def test_websocket_lifecycle(client: TestClient, auth_headers):
    """Test complete WebSocket lifecycle"""
    with client.websocket_connect(
        "/ws/locks", 
        headers=auth_headers
    ) as websocket:
        # Test connection
        data = websocket.receive_json()
        assert data["type"] == "connection_established"
        
        # Test message sending
        websocket.send_json({
            "action": "subscribe",
            "channel": "project_123"
        })
        
        # Test message receiving
        response = websocket.receive_json()
        assert response["status"] == "subscribed"
```

## Common Test Patterns

### Mocking External Services

```python
from unittest.mock import patch, AsyncMock

@patch("server.services.github_api.get_user")
async def test_github_integration(mock_get_user):
    """Mock external API calls"""
    mock_get_user.return_value = {
        "id": 123,
        "login": "testuser",
        "email": "test@example.com"
    }
    
    response = client.get("/api/github/profile")
    assert response.status_code == 200
    assert response.json()["login"] == "testuser"
```

### Testing Error Conditions

```python
def test_error_handling_patterns(client):
    """Test various error conditions"""
    
    # Test 404 Not Found
    response = client.get("/api/projects/non-existent")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
    
    # Test 400 Bad Request
    response = client.post("/api/projects", json={"invalid": "data"})
    assert response.status_code == 422  # FastAPI validation error
    assert "field required" in str(response.json())
    
    # Test 500 Internal Server Error
    with patch("server.db.get_session", side_effect=Exception("DB Error")):
        response = client.get("/api/projects")
        assert response.status_code == 500
```

### Authentication & Authorization Testing

```python
def test_authentication_required(client):
    """Test endpoints require authentication"""
    response = client.get("/api/protected")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_authorization_levels(client, admin_headers, user_headers):
    """Test different authorization levels"""
    # Admin can access
    response = client.delete("/api/users/123", headers=admin_headers)
    assert response.status_code == 204
    
    # Regular user cannot
    response = client.delete("/api/users/123", headers=user_headers)
    assert response.status_code == 403
```

### State Management in Tests

```python
class TestProjectWorkflow:
    """Test stateful workflows with proper isolation"""
    
    @pytest.fixture(autouse=True)
    def setup(self, db_session):
        """Reset state before each test"""
        db_session.query(Project).delete()
        db_session.commit()
    
    def test_complete_project_lifecycle(self, client, auth_headers):
        """Test create, update, and delete project"""
        # Create
        create_response = client.post(
            "/api/projects",
            json={"name": "Test Project"},
            headers=auth_headers
        )
        project_id = create_response.json()["id"]
        
        # Update
        update_response = client.put(
            f"/api/projects/{project_id}",
            json={"name": "Updated Project"},
            headers=auth_headers
        )
        assert update_response.json()["name"] == "Updated Project"
        
        # Delete
        delete_response = client.delete(
            f"/api/projects/{project_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 204
```

### Time-based Testing

```python
from freezegun import freeze_time
from datetime import datetime, timedelta

@freeze_time("2024-01-01 12:00:00")
def test_token_expiration(client):
    """Test time-dependent behavior"""
    # Create token that expires in 1 hour
    token = create_token(expires_in=3600)
    
    # Token is valid now
    response = client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    
    # Move time forward 2 hours
    with freeze_time("2024-01-01 14:00:00"):
        response = client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401
        assert "token expired" in response.json()["detail"].lower()
```

## Testing Best Practices

### Arrange-Act-Assert Pattern

```python
def test_user_registration_aaa_pattern(client):
    """Follow Arrange-Act-Assert pattern"""
    
    # Arrange: Set up test data and state
    user_data = {
        "email": "test@example.com",
        "password": "SecurePass123!",
        "name": "Test User"
    }
    
    # Act: Perform the action being tested
    response = client.post("/api/auth/register", json=user_data)
    
    # Assert: Verify the results
    assert response.status_code == 201
    assert response.json()["email"] == user_data["email"]
    assert "password" not in response.json()  # Password should not be returned
```

### Test Isolation Principles

1. **Independent Tests**: Each test should run independently
   ```python
   # Bad: Tests depend on order
   def test_create_item():
       global item_id
       item_id = create_item()
   
   def test_delete_item():
       delete_item(item_id)  # Depends on test_create_item
   
   # Good: Self-contained tests
   def test_delete_item():
       item_id = create_test_item()
       response = client.delete(f"/api/items/{item_id}")
       assert response.status_code == 204
   ```

2. **Clean State**: Always start with known state
   ```python
   @pytest.fixture(autouse=True)
   def clean_database(db_session):
       """Ensure clean state for each test"""
       yield
       db_session.query(Item).delete()
       db_session.commit()
   ```

### When to Use Integration vs Unit Tests

**Use Unit Tests When:**
- Testing business logic in isolation
- Testing input validation
- Testing error handling
- Tests can run in milliseconds
- External dependencies can be easily mocked

**Use Integration Tests When:**
- Testing workflows spanning multiple components
- Verifying data persistence
- Testing third-party integrations
- Testing WebSocket connections
- Ensuring components work together correctly

### Performance Testing Guidelines

```python
import time
import pytest

def test_endpoint_performance(client, auth_headers):
    """Ensure endpoints meet performance requirements"""
    start_time = time.time()
    
    response = client.get("/api/projects", headers=auth_headers)
    
    elapsed_time = time.time() - start_time
    
    assert response.status_code == 200
    assert elapsed_time < 0.5  # Should respond within 500ms

@pytest.mark.slow
def test_bulk_operation_performance(client, auth_headers):
    """Test performance of bulk operations"""
    # Create 100 items
    items = [{"name": f"Item {i}"} for i in range(100)]
    
    start_time = time.time()
    response = client.post(
        "/api/items/bulk",
        json=items,
        headers=auth_headers
    )
    elapsed_time = time.time() - start_time
    
    assert response.status_code == 201
    assert elapsed_time < 5.0  # Should complete within 5 seconds
```

## Debugging Tests

### Using Print Statements

```bash
# Run with -s flag to see print output
pytest tests/api/test_auth.py -s

# In your test:
def test_debug_example(client):
    response = client.get("/api/users")
    print(f"Status: {response.status_code}")
    print(f"Headers: {response.headers}")
    print(f"Body: {response.json()}")
    assert response.status_code == 200
```

### Debugging Async Tests

```python
import asyncio
import logging

# Configure logging for async debugging
logging.basicConfig(level=logging.DEBUG)

@pytest.mark.asyncio
async def test_async_debugging():
    """Debug async operations"""
    logger = logging.getLogger(__name__)
    
    logger.debug("Starting async operation")
    result = await some_async_function()
    logger.debug(f"Result: {result}")
    
    # Use asyncio.create_task for concurrent operations
    task1 = asyncio.create_task(async_operation_1())
    task2 = asyncio.create_task(async_operation_2())
    
    results = await asyncio.gather(task1, task2)
    logger.debug(f"Concurrent results: {results}")
```

### Common Gotchas and Solutions

1. **Async Test Decorator Missing**
   ```python
   # Wrong: Forgot @pytest.mark.asyncio
   async def test_async_endpoint():
       pass
   
   # Right: Include decorator
   @pytest.mark.asyncio
   async def test_async_endpoint():
       pass
   ```

2. **Database Transaction Isolation**
   ```python
   # Problem: Changes not visible in test
   def test_transaction_isolation(db_session):
       create_item(db_session)
       # Item might not be visible to API endpoint
       
   # Solution: Commit in tests when needed
   def test_transaction_isolation(db_session):
       create_item(db_session)
       db_session.commit()  # Make visible to other connections
   ```

3. **WebSocket Connection Cleanup**
   ```python
   # Always use context manager for cleanup
   with client.websocket_connect("/ws/test") as websocket:
       # Test code here
       pass  # Connection automatically closed
   ```

### VS Code Debugging Configuration

Add to `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Pytest",
            "type": "python",
            "request": "launch",
            "module": "pytest",
            "args": [
                "-xvs",
                "${file}::${selectedText}",
                "--no-cov"  // Disable coverage during debugging
            ],
            "console": "integratedTerminal",
            "justMyCode": false
        }
    ]
}
```

## CI/CD Considerations

### Environment Differences

```python
# Handle CI vs local differences
IS_CI = os.getenv("CI", "false").lower() == "true"

@pytest.mark.skipif(IS_CI, reason="Requires local Docker")
def test_redis_integration():
    """Test that requires Redis running locally"""
    pass

@pytest.mark.skipif(not IS_CI, reason="CI only test")
def test_deployment_configuration():
    """Test that verifies CI deployment settings"""
    pass
```

### Required Environment Variables

```bash
# .env.test - Test environment configuration
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test_secret_key_for_testing_only
API_KEY=test_api_key
ENVIRONMENT=test

# GitHub Actions secrets needed:
# - TEST_DATABASE_URL
# - TEST_REDIS_URL
# - TEST_JWT_SECRET
```

### Handling Flaky Tests

```python
import pytest
from tenacity import retry, stop_after_attempt, wait_fixed

@pytest.mark.flaky(reruns=3, reruns_delay=1)
def test_potentially_flaky_endpoint(client):
    """Retry flaky tests automatically"""
    response = client.get("/api/external-service")
    assert response.status_code == 200

@retry(stop=stop_after_attempt(3), wait=wait_fixed(1))
def make_request_with_retry(client, url):
    """Retry helper for flaky operations"""
    response = client.get(url)
    assert response.status_code == 200
    return response
```

### Test Parallelization

```bash
# Run tests in parallel (requires pytest-xdist)
pytest tests/ -n auto

# Run specific test types in parallel
pytest tests/unit/ -n 4
pytest tests/integration/ -n 2  # Less parallelization for DB tests

# Marks for parallel execution
@pytest.mark.parallel_safe
def test_stateless_operation():
    """Safe to run in parallel"""
    pass

@pytest.mark.serial
def test_database_migration():
    """Must run serially"""
    pass
```

## Useful Code Snippets

### Custom Assertions

```python
# tests/utils/assertions.py
def assert_valid_uuid(value: str):
    """Assert value is a valid UUID"""
    import uuid
    try:
        uuid.UUID(value)
    except ValueError:
        pytest.fail(f"'{value}' is not a valid UUID")

def assert_datetime_close(dt1, dt2, tolerance_seconds=1):
    """Assert two datetimes are close"""
    diff = abs((dt1 - dt2).total_seconds())
    assert diff <= tolerance_seconds, f"Datetimes differ by {diff} seconds"
```

### Test Data Builders

```python
# tests/utils/builders.py
class ProjectBuilder:
    """Builder for test project data"""
    def __init__(self):
        self.data = {
            "name": "Test Project",
            "description": "Test Description",
            "status": "active"
        }
    
    def with_name(self, name: str):
        self.data["name"] = name
        return self
    
    def with_status(self, status: str):
        self.data["status"] = status
        return self
    
    def build(self):
        return self.data

# Usage in tests
def test_create_project_variations(client):
    draft_project = ProjectBuilder().with_status("draft").build()
    response = client.post("/api/projects", json=draft_project)
    assert response.json()["status"] == "draft"
```

### WebSocket Test Helpers

```python
# tests/utils/websocket.py
class WebSocketTester:
    """Helper for WebSocket testing"""
    def __init__(self, client, path, headers=None):
        self.client = client
        self.path = path
        self.headers = headers or {}
        self.messages = []
    
    async def __aenter__(self):
        self.websocket = self.client.websocket_connect(
            self.path, 
            headers=self.headers
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.websocket.close()
    
    async def send_and_receive(self, message):
        await self.websocket.send_json(message)
        response = await self.websocket.receive_json()
        self.messages.append((message, response))
        return response
```

## Example Test Files

### Exemplar Unit Test: `tests/api/test_auth.py`
Shows proper structure for authentication testing, including:
- Token generation and validation
- Login/logout flows
- Permission checking
- Error handling

### Exemplar Integration Test: `tests/integration/test_workflows.py`
Demonstrates:
- Multi-step user workflows
- State persistence across requests
- Complex business logic verification
- Transaction handling

### Exemplar WebSocket Test: `tests/api/test_locks.py`
Illustrates:
- WebSocket connection lifecycle
- Message broadcasting
- Subscription management
- Connection error handling

## Decision Guidelines

### When to Mock vs When to Integrate

**Mock When:**
- External service is slow or unreliable
- Testing error conditions that are hard to reproduce
- Service has usage limits or costs
- You need deterministic responses
- Testing edge cases

**Integrate When:**
- Testing the integration itself
- Behavior depends on real service nuances
- Testing data persistence
- Verifying performance characteristics
- Building confidence in production behavior

### Test Granularity

```python
# Too granular: Testing implementation details
def test_internal_method():
    assert _calculate_hash("test") == "expected_hash"

# Just right: Testing public behavior
def test_password_hashing():
    user = create_user(password="test123")
    assert user.verify_password("test123")
    assert not user.verify_password("wrong")

# Too broad: Testing everything at once
def test_entire_application():
    # 500 lines of testing everything...
    pass

# Just right: Focused integration test
def test_user_registration_flow():
    # Test just the registration workflow
    pass
```

## Continuous Improvement

The test suite should evolve with the codebase:

1. **Add tests for bugs**: When fixing a bug, add a test that reproduces it first
2. **Refactor tests**: Apply the same standards as production code
3. **Remove obsolete tests**: Delete tests for removed features
4. **Update documentation**: Keep this README current with new patterns
5. **Monitor test performance**: Keep the suite fast enough for TDD

Remember: Tests are not just about catching bugs—they're about building confidence, documenting behavior, and enabling fearless refactoring.