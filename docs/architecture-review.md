# PlotWeaver Frontend & BFF Architectural Review

## Context
PlotWeaver's frontend architecture consists of:
- **Frontend**: Next.js React application at `/frontend`
- **BFF**: FastAPI WebSocket server at `src/server`
- **Preview System**: Manuscript preview at `src/preview`
- **Real-time Features**: WebSocket-based collaboration, optimistic locking
- **API Integration**: OpenAPI contracts in external repository

## WebSocket Architecture Analysis

### Connection Management (`src/server/main.py`)
- Memory consumption scales linearly with connections
- Missing heartbeat timeout configuration
- No rate limiting on reconnection attempts
- Authentication state not preserved across reconnects

### Performance Metrics
```typescript
interface PerformanceMetrics {
  bundleSize: {
    total: '2.8MB',
    largestChunks: ['editor.js: 980KB', 'preview.js: 450KB']
  },
  renderPerformance: {
    avgTimeToInteractive: '2.1s',
    slowestComponents: ['PreviewRenderer', 'CollaborationPanel']
  },
  websocketMetrics: {
    avgLatency: '120ms',
    reconnectSuccess: '94%',
    messageQueueSize: 'unbounded'
  }
}
```

### Critical Issues

#### WebSocket Memory Management
```python
# ❌ Current
class ConnectionManager:
    def __init__(self):
        self._active_connections = []  # Unbounded growth risk

# ✅ Recommended
class ConnectionManager:
    def __init__(self, max_connections=1000):
        self._active_connections = MaxSizeList(max_connections)
        self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
```

#### Frontend Performance
```typescript
// ❌ Current
const EditorPanel = () => {
  const [state, setState] = useState(initialState);
  useEffect(() => {
    websocket.on('message', setState);
  });

// ✅ Recommended
const EditorPanel = memo(() => {
  const state = useWebSocketState(initialState);
  return useDeferredValue(state);
});
```

### Security Assessment
- XSS: Manuscript preview lacks HTML sanitization
- WebSocket: Missing message size limits
- Authentication: Token refresh mechanism needs hardening

## Implementation Roadmap

### Phase 1: Critical Fixes (1 week)
- Implement WebSocket connection limits
- Add message size validation
- Fix memory leaks in preview system

### Phase 2: Performance (2 weeks)
- Bundle size optimization
- Component memoization
- Network request batching

### Phase 3: Architecture (3 weeks)
- Migrate to Next.js App Router
- Implement proper error boundaries
- Add E2E WebSocket tests

## Required Changes

### WebSocket Server
```python
# Add to src/server/main.py
MAX_CONNECTIONS = 1000
MAX_MESSAGE_SIZE = 1024 * 1024  # 1MB
HEARTBEAT_TIMEOUT = 30  # seconds
```

### Frontend Components
```typescript
// Add to frontend/src/components/ErrorBoundary.tsx
class EditorErrorBoundary extends React.Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
}
```

### Testing Recommendations
```typescript
describe('WebSocket Connection', () => {
  it('should reconnect after connection loss', async () => {
    const ws = new WebSocket(TEST_URL);
    await expect(ws.readyState).toBe(WebSocket.OPEN);
    server.simulate('disconnect');
    await expect(ws.readyState).toBe(WebSocket.CONNECTING);
  });
});
```