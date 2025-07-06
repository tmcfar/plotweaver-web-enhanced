"""Rate limiting for WebSocket connections."""
import time
import asyncio
from collections import defaultdict, deque
from typing import Dict, Deque, Optional
from dataclasses import dataclass


@dataclass
class RateLimitConfig:
    """Rate limiting configuration."""
    max_messages_per_minute: int = 60
    max_connections_per_ip: int = 10
    burst_allowance: int = 10
    cooldown_period: int = 300  # 5 minutes


class SlidingWindowRateLimiter:
    """Sliding window rate limiter for WebSocket messages."""
    
    def __init__(self, config: RateLimitConfig):
        self.config = config
        self.message_timestamps: Dict[str, Deque[float]] = defaultdict(deque)
        self.violation_counts: Dict[str, int] = defaultdict(int)
        self.cooldown_until: Dict[str, float] = {}
    
    def is_allowed(self, client_id: str) -> tuple[bool, Optional[str]]:
        """Check if client is allowed to send a message."""
        current_time = time.time()
        
        # Check if client is in cooldown
        if client_id in self.cooldown_until:
            if current_time < self.cooldown_until[client_id]:
                remaining = int(self.cooldown_until[client_id] - current_time)
                return False, f"Rate limited. Cooldown for {remaining}s"
            else:
                # Cooldown expired, reset
                del self.cooldown_until[client_id]
                self.violation_counts[client_id] = 0
        
        # Clean old timestamps (older than 1 minute)
        timestamps = self.message_timestamps[client_id]
        minute_ago = current_time - 60
        while timestamps and timestamps[0] < minute_ago:
            timestamps.popleft()
        
        # Check rate limit
        if len(timestamps) >= self.config.max_messages_per_minute:
            # Rate limit violation
            self.violation_counts[client_id] += 1
            violations = self.violation_counts[client_id]
            
            # Apply progressive penalties
            if violations >= 3:
                # Severe penalty: 5 minute cooldown
                self.cooldown_until[client_id] = current_time + self.config.cooldown_period
                return False, f"Too many violations. Cooldown for {self.config.cooldown_period}s"
            elif violations >= 2:
                # Medium penalty: 1 minute cooldown
                self.cooldown_until[client_id] = current_time + 60
                return False, "Rate limited. Cooldown for 60s"
            else:
                # First violation: short cooldown
                self.cooldown_until[client_id] = current_time + 10
                return False, "Rate limited. Cooldown for 10s"
        
        # Allow message and record timestamp
        timestamps.append(current_time)
        return True, None
    
    def cleanup_old_data(self):
        """Clean up old data to prevent memory leaks."""
        current_time = time.time()
        hour_ago = current_time - 3600
        
        # Clean old message timestamps
        for client_id in list(self.message_timestamps.keys()):
            timestamps = self.message_timestamps[client_id]
            while timestamps and timestamps[0] < hour_ago:
                timestamps.popleft()
            
            # Remove empty deques
            if not timestamps:
                del self.message_timestamps[client_id]
        
        # Clean expired cooldowns
        for client_id in list(self.cooldown_until.keys()):
            if current_time > self.cooldown_until[client_id]:
                del self.cooldown_until[client_id]


class ConnectionRateLimiter:
    """Rate limiter for WebSocket connections by IP address."""
    
    def __init__(self, config: RateLimitConfig):
        self.config = config
        self.connections_by_ip: Dict[str, set] = defaultdict(set)
        self.connection_attempts: Dict[str, Deque[float]] = defaultdict(deque)
        self.blocked_ips: Dict[str, float] = {}
    
    def can_connect(self, ip_address: str, client_id: str) -> tuple[bool, Optional[str]]:
        """Check if IP can establish new connection."""
        current_time = time.time()
        
        # Check if IP is blocked
        if ip_address in self.blocked_ips:
            if current_time < self.blocked_ips[ip_address]:
                remaining = int(self.blocked_ips[ip_address] - current_time)
                return False, f"IP blocked. Unblocked in {remaining}s"
            else:
                del self.blocked_ips[ip_address]
        
        # Clean old connection attempts (older than 1 minute)
        attempts = self.connection_attempts[ip_address]
        minute_ago = current_time - 60
        while attempts and attempts[0] < minute_ago:
            attempts.popleft()
        
        # Check connection rate (attempts per minute)
        if len(attempts) >= self.config.max_connections_per_ip * 2:  # 2x the limit for attempts
            # Too many connection attempts, block IP
            self.blocked_ips[ip_address] = current_time + 300  # 5 minute block
            return False, "Too many connection attempts. IP blocked for 5 minutes"
        
        # Check current connection count
        current_connections = len(self.connections_by_ip[ip_address])
        if current_connections >= self.config.max_connections_per_ip:
            return False, f"Maximum {self.config.max_connections_per_ip} connections per IP"
        
        # Allow connection
        attempts.append(current_time)
        self.connections_by_ip[ip_address].add(client_id)
        return True, None
    
    def disconnect(self, ip_address: str, client_id: str):
        """Remove connection from tracking."""
        if ip_address in self.connections_by_ip:
            self.connections_by_ip[ip_address].discard(client_id)
            if not self.connections_by_ip[ip_address]:
                del self.connections_by_ip[ip_address]


class RateLimitManager:
    """Central rate limiting manager."""
    
    def __init__(self, config: Optional[RateLimitConfig] = None):
        self.config = config or RateLimitConfig()
        self.message_limiter = SlidingWindowRateLimiter(self.config)
        self.connection_limiter = ConnectionRateLimiter(self.config)
        self._cleanup_task: Optional[asyncio.Task] = None
    
    def start_cleanup_task(self):
        """Start periodic cleanup task."""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
    
    async def _periodic_cleanup(self):
        """Periodic cleanup of old data."""
        while True:
            await asyncio.sleep(300)  # Clean every 5 minutes
            self.message_limiter.cleanup_old_data()
    
    def check_message_rate(self, client_id: str) -> tuple[bool, Optional[str]]:
        """Check if client can send a message."""
        return self.message_limiter.is_allowed(client_id)
    
    def check_connection_rate(self, ip_address: str, client_id: str) -> tuple[bool, Optional[str]]:
        """Check if IP can establish connection."""
        return self.connection_limiter.can_connect(ip_address, client_id)
    
    def on_disconnect(self, ip_address: str, client_id: str):
        """Handle client disconnection."""
        self.connection_limiter.disconnect(ip_address, client_id)


# Global rate limiter instance
rate_limiter = RateLimitManager()