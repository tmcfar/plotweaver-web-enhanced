"""JWT Authentication middleware for WebSocket connections."""
try:
    import jwt
except ImportError:
    jwt = None
import time
from datetime import datetime, timedelta, UTC
from typing import Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class UserClaims:
    """User claims extracted from JWT token."""
    user_id: str
    username: str
    email: str
    permissions: list[str]
    exp: int
    iat: int


class JWTAuthenticator:
    """JWT authentication handler for WebSocket connections."""
    
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.token_expiry = 3600  # 1 hour
        self.refresh_threshold = 300  # 5 minutes before expiry
    
    def create_token(self, user_data: Dict[str, Any]) -> str:
        """Create a new JWT token for user."""
        now = datetime.now(UTC)
        payload = {
            "user_id": user_data["user_id"],
            "username": user_data["username"],
            "email": user_data["email"],
            "permissions": user_data.get("permissions", ["read", "write"]),
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(seconds=self.token_expiry)).timestamp()),
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[UserClaims]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Check if token is expired
            if payload["exp"] < time.time():
                return None
            
            return UserClaims(
                user_id=payload["user_id"],
                username=payload["username"],
                email=payload["email"],
                permissions=payload["permissions"],
                exp=payload["exp"],
                iat=payload["iat"]
            )
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def needs_refresh(self, claims: UserClaims) -> bool:
        """Check if token needs refresh."""
        current_time = time.time()
        time_until_expiry = claims.exp - current_time
        return time_until_expiry < self.refresh_threshold
    
    def refresh_token(self, old_token: str) -> Optional[str]:
        """Create a new token from an existing valid token."""
        claims = self.verify_token(old_token)
        if not claims:
            return None
        
        user_data = {
            "user_id": claims.user_id,
            "username": claims.username,
            "email": claims.email,
            "permissions": claims.permissions
        }
        
        return self.create_token(user_data)


class WebSocketAuthManager:
    """Manages authentication state for WebSocket connections."""
    
    def __init__(self, jwt_authenticator: JWTAuthenticator):
        self.jwt_auth = jwt_authenticator
        self.authenticated_connections: Dict[str, UserClaims] = {}
        self.connection_tokens: Dict[str, str] = {}
    
    async def authenticate_connection(self, client_id: str, token: str) -> bool:
        """Authenticate a WebSocket connection."""
        claims = self.jwt_auth.verify_token(token)
        if not claims:
            return False
        
        self.authenticated_connections[client_id] = claims
        self.connection_tokens[client_id] = token
        return True
    
    def get_user_claims(self, client_id: str) -> Optional[UserClaims]:
        """Get user claims for a connection."""
        return self.authenticated_connections.get(client_id)
    
    def has_permission(self, client_id: str, permission: str) -> bool:
        """Check if user has specific permission."""
        claims = self.get_user_claims(client_id)
        if not claims:
            return False
        return permission in claims.permissions
    
    async def refresh_connection_token(self, client_id: str) -> Optional[str]:
        """Refresh token for a connection if needed."""
        if client_id not in self.connection_tokens:
            return None
        
        old_token = self.connection_tokens[client_id]
        claims = self.authenticated_connections.get(client_id)
        
        if not claims or not self.jwt_auth.needs_refresh(claims):
            return None
        
        new_token = self.jwt_auth.refresh_token(old_token)
        if new_token:
            new_claims = self.jwt_auth.verify_token(new_token)
            if new_claims:
                self.authenticated_connections[client_id] = new_claims
                self.connection_tokens[client_id] = new_token
                return new_token
        
        return None
    
    def disconnect_user(self, client_id: str):
        """Clean up authentication data for disconnected user."""
        self.authenticated_connections.pop(client_id, None)
        self.connection_tokens.pop(client_id, None)


# Global instances
JWT_SECRET = "your-secret-key-change-in-production"  # TODO: Move to env vars
jwt_authenticator = JWTAuthenticator(JWT_SECRET)
websocket_auth_manager = WebSocketAuthManager(jwt_authenticator)