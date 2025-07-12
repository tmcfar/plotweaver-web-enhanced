"""Tests for authentication and rate limiting."""

import pytest
import time
from bff.auth.jwt_auth import JWTAuthenticator, WebSocketAuthManager
from bff.auth.rate_limiter import RateLimitManager, RateLimitConfig


class TestJWTAuthentication:
    """Test JWT authentication functionality."""

    def setup_method(self):
        """Setup test fixtures."""
        self.jwt_auth = JWTAuthenticator("test-secret-key")
        self.auth_manager = WebSocketAuthManager(self.jwt_auth)

    def test_create_and_verify_token(self):
        """Test token creation and verification."""
        user_data = {
            "user_id": "test-user",
            "username": "testuser",
            "email": "test@example.com",
            "permissions": ["read", "write"],
        }

        token = self.jwt_auth.create_token(user_data)
        assert token is not None

        claims = self.jwt_auth.verify_token(token)
        assert claims is not None
        assert claims.user_id == "test-user"
        assert claims.username == "testuser"
        assert claims.email == "test@example.com"
        assert "read" in claims.permissions
        assert "write" in claims.permissions

    def test_expired_token(self):
        """Test expired token handling."""
        # Create authenticator with very short expiry
        short_auth = JWTAuthenticator("test-secret", algorithm="HS256")
        short_auth.token_expiry = 1  # 1 second

        user_data = {
            "user_id": "test-user",
            "username": "testuser",
            "email": "test@example.com",
        }

        token = short_auth.create_token(user_data)

        # Token should be valid immediately
        claims = short_auth.verify_token(token)
        assert claims is not None

        # Wait for expiry
        time.sleep(2)

        # Token should now be invalid
        claims = short_auth.verify_token(token)
        assert claims is None

    def test_invalid_token(self):
        """Test invalid token handling."""
        claims = self.jwt_auth.verify_token("invalid-token")
        assert claims is None

        claims = self.jwt_auth.verify_token("")
        assert claims is None

    @pytest.mark.asyncio
    async def test_websocket_auth_manager(self):
        """Test WebSocket authentication manager."""
        user_data = {
            "user_id": "test-user",
            "username": "testuser",
            "email": "test@example.com",
            "permissions": ["read", "write"],
        }

        token = self.jwt_auth.create_token(user_data)
        client_id = "test-client-1"

        # Test authentication
        result = await self.auth_manager.authenticate_connection(client_id, token)
        assert result is True

        # Test claims retrieval
        claims = self.auth_manager.get_user_claims(client_id)
        assert claims is not None
        assert claims.user_id == "test-user"

        # Test permission check
        assert self.auth_manager.has_permission(client_id, "read") is True
        assert self.auth_manager.has_permission(client_id, "write") is True
        assert self.auth_manager.has_permission(client_id, "admin") is False

        # Test disconnection
        self.auth_manager.disconnect_user(client_id)
        claims = self.auth_manager.get_user_claims(client_id)
        assert claims is None


class TestRateLimiting:
    """Test rate limiting functionality."""

    def setup_method(self):
        """Setup test fixtures."""
        config = RateLimitConfig(
            max_messages_per_minute=5,  # Low limit for testing
            max_connections_per_ip=2,
            burst_allowance=2,
            cooldown_period=10,
        )
        self.rate_limiter = RateLimitManager(config)

    def test_message_rate_limiting(self):
        """Test message rate limiting."""
        client_id = "test-client"

        # Should allow initial messages
        for i in range(5):
            allowed, msg = self.rate_limiter.check_message_rate(client_id)
            assert allowed is True, f"Message {i} should be allowed"
            assert msg is None

        # Should block additional messages
        allowed, msg = self.rate_limiter.check_message_rate(client_id)
        assert allowed is False
        assert "Rate limited" in msg

    def test_connection_rate_limiting(self):
        """Test connection rate limiting."""
        ip_address = "192.168.1.100"

        # Should allow initial connections
        for i in range(2):
            client_id = f"client-{i}"
            allowed, msg = self.rate_limiter.check_connection_rate(
                ip_address, client_id
            )
            assert allowed is True, f"Connection {i} should be allowed"
            assert msg is None

        # Should block additional connections
        client_id = "client-3"
        allowed, msg = self.rate_limiter.check_connection_rate(ip_address, client_id)
        assert allowed is False
        assert "Maximum" in msg

    def test_connection_cleanup(self):
        """Test connection cleanup on disconnect."""
        ip_address = "192.168.1.101"
        client_id = "test-client"

        # Connect
        allowed, _ = self.rate_limiter.check_connection_rate(ip_address, client_id)
        assert allowed is True

        # Disconnect
        self.rate_limiter.on_disconnect(ip_address, client_id)

        # Should be able to connect again
        allowed, _ = self.rate_limiter.check_connection_rate(ip_address, client_id)
        assert allowed is True

    def test_rate_limit_violations(self):
        """Test progressive penalties for violations."""
        client_id = "violator-client"

        # Fill up the rate limit
        for i in range(5):
            allowed, _ = self.rate_limiter.check_message_rate(client_id)
            assert allowed is True

        # First violation
        allowed, msg = self.rate_limiter.check_message_rate(client_id)
        assert allowed is False
        assert "10s" in msg  # Short cooldown

        # Wait and try again to trigger second violation
        time.sleep(11)
        allowed, msg = self.rate_limiter.check_message_rate(client_id)
        assert allowed is False
        assert "60s" in msg  # Medium cooldown

    @pytest.mark.asyncio
    async def test_token_refresh(self):
        """Test token refresh functionality."""
        user_data = {
            "user_id": "test-user",
            "username": "testuser",
            "email": "test@example.com",
            "permissions": ["read", "write"],
        }

        # Create authenticator with short expiry and refresh threshold
        short_auth = JWTAuthenticator("test-secret", algorithm="HS256")
        short_auth.token_expiry = 5  # 5 seconds
        short_auth.refresh_threshold = 3  # 3 seconds before expiry
        auth_manager = WebSocketAuthManager(short_auth)

        # Create initial token
        token = short_auth.create_token(user_data)
        client_id = "test-client"

        # Authenticate the connection
        assert await auth_manager.authenticate_connection(client_id, token) is True

        # Wait until we're in the refresh threshold
        time.sleep(3)

        # Check if token needs refresh
        claims = auth_manager.get_user_claims(client_id)
        assert claims is not None
        assert short_auth.needs_refresh(claims) is True

        # Get refresh token
        new_token = await auth_manager.refresh_connection_token(client_id)
        assert new_token is not None
        assert new_token != token

        # Verify new token is valid
        new_claims = short_auth.verify_token(new_token)
        assert new_claims is not None
        assert new_claims.user_id == user_data["user_id"]


if __name__ == "__main__":
    pytest.main([__file__])
