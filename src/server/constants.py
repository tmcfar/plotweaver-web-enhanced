# Connection settings
MAX_CONNECTIONS = 1000  # Maximum number of concurrent WebSocket connections
MAX_MESSAGE_SIZE = 1024 * 1024  # Maximum WebSocket message size (1MB)
HEARTBEAT_TIMEOUT = 30  # Heartbeat timeout in seconds
RECONNECT_BACKOFF = [1, 2, 5, 10]  # Reconnection backoff intervals in seconds
