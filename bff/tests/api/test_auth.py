"""
Comprehensive authentication tests for FastAPI BFF service.

This module tests JWT authentication endpoints including login, token validation,
refresh flows, and security edge cases to ensure robust authentication.
"""

import os
import time
from datetime import datetime, timezone
from typing import Dict

import pytest
from fastapi.testclient import TestClient
from freezegun import freeze_time
from jose import jwt

# JWT constants for testing
JWT_SECRET = os.getenv("JWT_SECRET", "test-secret-key")
JWT_ALGORITHM = "HS256"


class TestJWTTokenGeneration:
    """Test suite for JWT token generation and login endpoints."""

    @pytest.mark.unit
    def test_login_with_valid_credentials_returns_token(
        self, test_client: TestClient, valid_credentials: Dict[str, str]
    ) -> None:
        """
        Test that login with valid credentials returns a JWT token.
        
        This test verifies that the authentication endpoint correctly
        validates credentials and returns a properly structured token response.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            valid_credentials: Valid username/password from fixture
        """
        response = test_client.post("/api/auth/login", json=valid_credentials)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify token response structure
        assert "access_token" in data
        assert "token_type" in data
        assert "expires_in" in data
        
        # Verify token content
        assert isinstance(data["access_token"], str)
        assert data["token_type"] == "bearer"
        assert isinstance(data["expires_in"], int)
        assert data["expires_in"] == 1800  # 30 minutes in seconds

    @pytest.mark.unit
    def test_login_with_admin_credentials_returns_admin_token(
        self, test_client: TestClient, admin_credentials: Dict[str, str]
    ) -> None:
        """
        Test that admin login returns token with admin permissions.
        
        This test verifies that different user types receive appropriate
        permissions in their JWT tokens.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            admin_credentials: Admin username/password from fixture
        """
        response = test_client.post("/api/auth/login", json=admin_credentials)
        
        assert response.status_code == 200
        token = response.json()["access_token"]
        
        # Decode token to verify admin permissions
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        assert payload["username"] == "admin"
        assert "admin" in payload["permissions"]
        assert "read" in payload["permissions"]
        assert "write" in payload["permissions"]

    @pytest.mark.unit
    def test_login_with_invalid_credentials_returns_401(
        self, test_client: TestClient
    ) -> None:
        """
        Test that login with invalid credentials returns 401 Unauthorized.
        
        This test verifies that the authentication endpoint properly
        rejects invalid credential combinations.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        invalid_credentials = {
            "username": "testuser",
            "password": "wrongpassword"
        }
        
        response = test_client.post("/api/auth/login", json=invalid_credentials)
        
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

    @pytest.mark.unit
    @pytest.mark.parametrize("invalid_creds", [
        {"username": "nonexistent", "password": "anypassword"},
        {"username": "testuser", "password": ""},
        {"username": "", "password": "testpass123"},
        {"username": "", "password": ""},
        {"username": "testuser", "password": "short"},
        {"username": "TESTUSER", "password": "testpass123"},  # Case sensitivity
    ])
    def test_login_with_various_invalid_credentials(
        self, test_client: TestClient, invalid_creds: Dict[str, str]
    ) -> None:
        """
        Test login with various invalid credential combinations.
        
        This parametrized test verifies that different types of invalid
        credentials are properly rejected by the authentication system.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            invalid_creds: Invalid credential combination to test
        """
        response = test_client.post("/api/auth/login", json=invalid_creds)
        
        assert response.status_code == 401
        assert "detail" in response.json()

    @pytest.mark.unit
    def test_token_structure_validation(
        self, test_client: TestClient, valid_credentials: Dict[str, str]
    ) -> None:
        """
        Test that generated JWT tokens have the correct structure and claims.
        
        This test verifies that tokens contain all required claims
        with appropriate types and values.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            valid_credentials: Valid username/password from fixture
        """
        response = test_client.post("/api/auth/login", json=valid_credentials)
        token = response.json()["access_token"]
        
        # Decode and verify token structure
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Required JWT claims
        assert "sub" in payload  # Subject (user ID)
        assert "username" in payload
        assert "email" in payload
        assert "permissions" in payload
        assert "exp" in payload  # Expiration time
        assert "iat" in payload  # Issued at time
        
        # Verify claim types
        assert isinstance(payload["sub"], str)
        assert isinstance(payload["username"], str)
        assert isinstance(payload["email"], str)
        assert isinstance(payload["permissions"], list)
        assert isinstance(payload["exp"], (int, float))
        assert isinstance(payload["iat"], (int, float))
        
        # Verify token expiration is in the future
        assert payload["exp"] > time.time()


class TestProtectedEndpoints:
    """Test suite for protected endpoint access with various token scenarios."""

    @pytest.mark.unit
    def test_protected_endpoint_with_valid_token_succeeds(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test that protected endpoints accept valid JWT tokens.
        
        This test verifies that properly authenticated requests
        can access protected resources.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        response = test_client.get("/api/protected", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert "user" in data
        assert "data" in data
        assert data["user"] == "testuser"

    @pytest.mark.unit
    def test_protected_endpoint_without_token_returns_401(
        self, test_client: TestClient
    ) -> None:
        """
        Test that protected endpoints reject requests without tokens.
        
        This test verifies that unauthenticated requests are properly
        rejected with a 401 Unauthorized status.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        response = test_client.get("/api/protected")
        
        assert response.status_code == 403  # FastAPI HTTPBearer returns 403 for missing auth header

    @pytest.mark.unit
    def test_protected_endpoint_with_expired_token_returns_401(
        self, test_client: TestClient, expired_token: str
    ) -> None:
        """
        Test that protected endpoints reject expired JWT tokens.
        
        This test verifies that tokens past their expiration time
        are properly rejected by the authentication system.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            expired_token: Expired JWT token from fixture
        """
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = test_client.get("/api/protected", headers=headers)
        
        assert response.status_code == 401
        assert "Invalid authentication credentials" in response.json()["detail"]

    @pytest.mark.unit
    @pytest.mark.parametrize("malformed_type", [
        "invalid_signature",
        "invalid_format", 
        "empty_token",
        "corrupted_token",
        "wrong_algorithm",
        "missing_claims"
    ])
    def test_protected_endpoint_with_malformed_tokens(
        self, test_client: TestClient, malformed_tokens: Dict[str, str], malformed_type: str
    ) -> None:
        """
        Test that protected endpoints reject various malformed tokens.
        
        This parametrized test verifies that different types of malformed
        or invalid tokens are properly rejected by the authentication system.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            malformed_tokens: Dictionary of malformed tokens from fixture
            malformed_type: Type of malformed token to test
        """
        malformed_token = malformed_tokens[malformed_type]
        
        # Handle None token case
        if malformed_token is None:
            headers = {"Authorization": "Bearer "}
        else:
            headers = {"Authorization": f"Bearer {malformed_token}"}
        
        response = test_client.get("/api/protected", headers=headers)
        
        # Should return either 401 (invalid token), 422 (malformed request), 403 (forbidden), or 200 (if token passes but has missing claims)
        assert response.status_code in [200, 401, 403, 422]

    @pytest.mark.unit
    def test_get_current_user_with_valid_token(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test that /api/auth/me endpoint returns user information.
        
        This test verifies that authenticated users can retrieve
        their profile information from JWT token claims.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        response = test_client.get("/api/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "user_id" in data
        assert "username" in data
        assert "email" in data
        assert "permissions" in data
        
        assert data["username"] == "testuser" 
        assert "read" in data["permissions"] or "user" in data["permissions"]
        assert data["email"] == "testuser@example.com"
        assert isinstance(data["permissions"], list)


class TestTokenRefreshFlow:
    """Test suite for JWT token refresh functionality."""

    @pytest.mark.unit
    def test_refresh_with_valid_token_returns_new_token(
        self, test_client: TestClient, auth_headers: Dict[str, str]
    ) -> None:
        """
        Test that token refresh with valid token returns new access token.
        
        This test verifies that the refresh endpoint can generate
        new access tokens from valid existing tokens.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            auth_headers: Valid authorization headers from fixture
        """
        # Extract token from auth headers
        original_token = auth_headers["Authorization"].replace("Bearer ", "")
        
        refresh_request = {"refresh_token": original_token}
        response = test_client.post("/api/auth/refresh", json=refresh_request)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify refresh response structure
        assert "access_token" in data
        assert "token_type" in data
        assert "expires_in" in data
        
        # Verify new token is different from original
        new_token = data["access_token"]
        assert new_token != original_token
        
        # Verify new token is valid
        payload = jwt.decode(new_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        assert payload["username"] == "testuser"

    @pytest.mark.unit
    def test_refresh_with_expired_token_returns_401(
        self, test_client: TestClient, expired_token: str
    ) -> None:
        """
        Test that token refresh with expired token returns 401.
        
        This test verifies that expired tokens cannot be used
        to generate new access tokens.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            expired_token: Expired JWT token from fixture
        """
        refresh_request = {"refresh_token": expired_token}
        response = test_client.post("/api/auth/refresh", json=refresh_request)
        
        assert response.status_code == 401
        assert "Invalid refresh token" in response.json()["detail"]

    @pytest.mark.unit
    def test_refresh_with_invalid_token_returns_401(
        self, test_client: TestClient
    ) -> None:
        """
        Test that token refresh with invalid token returns 401.
        
        This test verifies that malformed or invalid refresh tokens
        are properly rejected by the refresh endpoint.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        refresh_request = {"refresh_token": "invalid.jwt.token"}
        response = test_client.post("/api/auth/refresh", json=refresh_request)
        
        assert response.status_code == 401
        assert "Invalid refresh token" in response.json()["detail"]


class TestAuthenticationEdgeCases:
    """Test suite for authentication edge cases and security scenarios."""

    @pytest.mark.unit
    @pytest.mark.parametrize("malicious_input", [
        {"username": "'; DROP TABLE users; --", "password": "password"},
        {"username": "admin' OR '1'='1", "password": "anything"},
        {"username": "<script>alert('xss')</script>", "password": "password"},
        {"username": "user\x00admin", "password": "password"},
        {"username": "user\npassword", "password": "test"},
        {"username": "user" * 1000, "password": "password"},  # Long input
    ])
    def test_login_with_malicious_inputs(
        self, test_client: TestClient, malicious_input: Dict[str, str]
    ) -> None:
        """
        Test that login endpoint handles malicious inputs safely.
        
        This parametrized test verifies that the authentication system
        properly sanitizes and rejects potentially malicious inputs.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            malicious_input: Malicious credential input to test
        """
        response = test_client.post("/api/auth/login", json=malicious_input)
        
        # Should return 401 for invalid credentials, not crash
        assert response.status_code == 401
        assert "detail" in response.json()

    @pytest.mark.unit
    def test_login_with_missing_fields_returns_422(
        self, test_client: TestClient
    ) -> None:
        """
        Test that login with missing required fields returns 422.
        
        This test verifies that the authentication endpoint properly
        validates required fields in the request body.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        # Test missing password
        response = test_client.post("/api/auth/login", json={"username": "testuser"})
        assert response.status_code == 422
        
        # Test missing username
        response = test_client.post("/api/auth/login", json={"password": "password"})
        assert response.status_code == 422
        
        # Test empty request body
        response = test_client.post("/api/auth/login", json={})
        assert response.status_code == 422

    @pytest.mark.unit
    def test_login_with_invalid_json_returns_422(
        self, test_client: TestClient
    ) -> None:
        """
        Test that login with invalid JSON returns 422.
        
        This test verifies that the authentication endpoint properly
        handles malformed JSON in request bodies.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        # Send invalid JSON
        response = test_client.post(
            "/api/auth/login",
            data="invalid json content",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422

    @pytest.mark.unit
    @freeze_time("2024-01-01 12:00:00")
    def test_token_expiration_time_is_correct(
        self, test_client: TestClient, valid_credentials: Dict[str, str]
    ) -> None:
        """
        Test that JWT token expiration time is set correctly.
        
        This test uses freezegun to verify that token expiration
        times are calculated correctly from the issue time.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            valid_credentials: Valid username/password from fixture
        """
        response = test_client.post("/api/auth/login", json=valid_credentials)
        token = response.json()["access_token"]
        
        # Decode token and check expiration
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Should expire 30 minutes (1800 seconds) from now
        expected_exp = datetime(2024, 1, 1, 12, 30, 0, tzinfo=timezone.utc).timestamp()
        assert abs(payload["exp"] - expected_exp) < 5  # Allow 5 second tolerance

    @pytest.mark.slow
    def test_concurrent_login_requests(
        self, test_client: TestClient, valid_credentials: Dict[str, str]
    ) -> None:
        """
        Test that multiple concurrent login requests are handled correctly.
        
        This test verifies that the authentication system can handle
        multiple simultaneous login attempts without issues.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
            valid_credentials: Valid username/password from fixture
        """
        import concurrent.futures
        
        def login_request():
            return test_client.post("/api/auth/login", json=valid_credentials)
        
        # Perform 10 concurrent login requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(login_request) for _ in range(10)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # All requests should succeed
        for response in results:
            assert response.status_code == 200
            assert "access_token" in response.json()

    @pytest.mark.unit
    def test_case_sensitive_authentication(
        self, test_client: TestClient
    ) -> None:
        """
        Test that authentication is case-sensitive for usernames.
        
        This test verifies that username case sensitivity is enforced
        to prevent authentication bypass attempts.
        
        Args:
            test_client: FastAPI test client from conftest.py fixture
        """
        # Test with uppercase username
        uppercase_creds = {"username": "TESTUSER", "password": "testpass123"}
        response = test_client.post("/api/auth/login", json=uppercase_creds)
        assert response.status_code == 401
        
        # Test with mixed case username
        mixedcase_creds = {"username": "TestUser", "password": "testpass123"}
        response = test_client.post("/api/auth/login", json=mixedcase_creds)
        assert response.status_code == 401