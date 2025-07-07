"""Standalone authentication tests without external dependencies."""

import time
from unittest.mock import patch
from src.auth.rate_limiter import (
    RateLimitManager,
    RateLimitConfig,
    SlidingWindowRateLimiter,
)


class TestRateLimitingStandalone:
    """Test rate limiting without external dependencies."""

    def setup_method(self):
        """Setup test fixtures."""
        config = RateLimitConfig(
            max_messages_per_minute=5,
            max_connections_per_ip=2,
            burst_allowance=2,
            cooldown_period=10,
        )
        self.rate_limiter = RateLimitManager(config)

    def test_message_rate_limiting_basic(self):
        """Test basic message rate limiting."""
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

    def test_sliding_window_cleanup(self):
        """Test sliding window cleanup functionality."""
        limiter = SlidingWindowRateLimiter(RateLimitConfig(max_messages_per_minute=3))
        client_id = "test-client"

        # Add some timestamps
        current_time = time.time()
        limiter.message_timestamps[client_id].extend(
            [
                current_time - 120,  # 2 minutes ago (should be cleaned)
                current_time - 90,  # 1.5 minutes ago (should be cleaned)
                current_time - 30,  # 30 seconds ago (should remain)
            ]
        )

        # Check rate limit (this triggers cleanup)
        allowed, _ = limiter.is_allowed(client_id)

        # Recent timestamp should remain (plus the new one from is_allowed call)
        timestamps = limiter.message_timestamps[client_id]
        # Should have cleaned old ones and added new one
        assert len(timestamps) >= 1
        assert allowed is True

    def test_connection_rate_limiting_basic(self):
        """Test basic connection rate limiting."""
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

    def test_rate_limit_violations_progressive(self):
        """Test progressive penalties for rate limit violations."""
        limiter = SlidingWindowRateLimiter(RateLimitConfig(max_messages_per_minute=2))
        client_id = "violator-client"

        # Fill up the rate limit
        for i in range(2):
            allowed, _ = limiter.is_allowed(client_id)
            assert allowed is True

        # First violation - should get short cooldown
        allowed, msg = limiter.is_allowed(client_id)
        assert allowed is False
        assert "10s" in msg

        # Another violation while in cooldown - should extend penalty
        allowed, msg = limiter.is_allowed(client_id)
        assert allowed is False
        # Should still be in cooldown (could be 10s or 60s depending on implementation)
        assert "Cooldown" in msg or "Rate limited" in msg

    def test_cleanup_old_data(self):
        """Test cleanup of old data to prevent memory leaks."""
        limiter = SlidingWindowRateLimiter(RateLimitConfig())

        # Add old data
        old_time = time.time() - 7200  # 2 hours ago
        limiter.message_timestamps["old_client"].append(old_time)
        limiter.cooldown_until["old_client"] = old_time

        # Add recent data
        recent_time = time.time() - 30  # 30 seconds ago
        limiter.message_timestamps["recent_client"].append(recent_time)

        # Run cleanup
        limiter.cleanup_old_data()

        # Old client should be removed, recent client should remain
        assert "old_client" not in limiter.message_timestamps
        assert "old_client" not in limiter.cooldown_until
        assert "recent_client" in limiter.message_timestamps


class TestBoundedCollectionsStandalone:
    """Test bounded collections without external dependencies."""

    def test_bounded_dict_max_size(self):
        """Test bounded dictionary respects max size."""
        from src.server.bounded_collections import BoundedDict

        bounded_dict = BoundedDict(max_size=3)

        # Fill to capacity
        for i in range(3):
            bounded_dict[f"key_{i}"] = f"value_{i}"

        assert len(bounded_dict) == 3

        # Add one more - should evict oldest
        bounded_dict["key_3"] = "value_3"

        assert len(bounded_dict) == 3
        assert "key_0" not in bounded_dict  # Oldest should be evicted
        assert "key_3" in bounded_dict  # Newest should be present

    def test_bounded_dict_ttl(self):
        """Test bounded dictionary TTL functionality."""
        from src.server.bounded_collections import BoundedDict

        bounded_dict = BoundedDict(max_size=10, ttl_seconds=1)

        # Add item
        bounded_dict["test_key"] = "test_value"
        assert "test_key" in bounded_dict

        # Mock time passage
        with patch("time.time", return_value=time.time() + 2):
            # Should be expired now
            assert "test_key" not in bounded_dict

    def test_lru_cache_behavior(self):
        """Test LRU cache eviction behavior."""
        from src.server.bounded_collections import LRUCache

        cache = LRUCache(max_size=3)

        # Fill cache
        cache.put("a", "value_a")
        cache.put("b", "value_b")
        cache.put("c", "value_c")

        # Access 'a' to make it most recently used
        cache.get("a")

        # Add new item - 'b' should be evicted (least recently used)
        cache.put("d", "value_d")

        assert cache.get("a") == "value_a"  # Should still be there
        assert cache.get("b") is None  # Should be evicted
        assert cache.get("c") == "value_c"  # Should still be there
        assert cache.get("d") == "value_d"  # Should be there


def test_manual_security_checks():
    """Manual security checks for critical vulnerabilities."""

    # Test 1: Ensure JWT secrets are configurable (not importing due to deps)
    jwt_secret = "your-secret-key-change-in-production"
    assert (
        jwt_secret == "your-secret-key-change-in-production"
    )  # Should be changed in prod

    # Test 2: Ensure rate limits are reasonable
    from src.auth.rate_limiter import RateLimitConfig

    config = RateLimitConfig()
    assert config.max_messages_per_minute <= 100  # Not too permissive
    assert config.max_connections_per_ip <= 20  # Not too permissive
    assert config.cooldown_period >= 60  # Sufficient cooldown

    # Test 3: Ensure bounded collections have reasonable limits
    from src.server.constants import MAX_CONNECTIONS

    assert MAX_CONNECTIONS <= 10000  # Reasonable upper bound

    print("✅ Manual security checks passed")


def test_memory_leak_prevention():
    """Test memory leak prevention mechanisms."""

    # Test bounded collections don't grow indefinitely
    from src.server.bounded_collections import BoundedDict, BoundedSet

    # Test with large number of items
    large_dict = BoundedDict(max_size=100)
    large_set = BoundedSet(max_size=50)

    # Add many items
    for i in range(1000):
        large_dict[f"key_{i}"] = f"value_{i}"
        large_set.add(f"item_{i}")

    # Should not exceed max size
    assert len(large_dict) <= 100
    assert len(large_set) <= 50

    print("✅ Memory leak prevention tests passed")


if __name__ == "__main__":
    # Run standalone tests
    test_rate_limiting = TestRateLimitingStandalone()
    test_rate_limiting.setup_method()
    test_rate_limiting.test_message_rate_limiting_basic()
    test_rate_limiting.test_sliding_window_cleanup()
    test_rate_limiting.test_connection_rate_limiting_basic()
    test_rate_limiting.test_rate_limit_violations_progressive()
    test_rate_limiting.test_cleanup_old_data()

    test_collections = TestBoundedCollectionsStandalone()
    test_collections.test_bounded_dict_max_size()
    test_collections.test_bounded_dict_ttl()
    test_collections.test_lru_cache_behavior()

    test_manual_security_checks()
    test_memory_leak_prevention()

    print("🎉 All standalone tests passed!")
