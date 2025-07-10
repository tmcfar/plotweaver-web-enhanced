# PlotWeaver Architecture Alignment Implementation Plan

## Executive Summary

This plan outlines the systematic approach to align the PlotWeaver codebase with the architecture defined in `/home/tmcfar/dev/pw-docs/architecture-overview.md`. The analysis reveals that while the core architecture is mostly correct, there are critical deviations in the BFF service that violate the read/write separation principle.

## Current State Analysis

### ✅ Correctly Implemented
1. **Backend** (pw2): Flask-based implementation with proper structure
2. **BFF** (pw-web/bff): FastAPI technology stack
3. **Frontend** (pw-web/frontend): Next.js implementation
4. **WebSocket**: Real-time collaboration infrastructure
5. **Agent System**: Multi-agent content generation
6. **Authentication**: JWT-based auth with OAuth support

### ❌ Critical Deviations
1. **Git Write Operations in BFF**: `git_write_endpoints.py` violates read/write separation
2. **Story Generation in BFF**: Direct implementation instead of backend proxy
3. **Missing Backend Proxy Pattern**: Some BFF endpoints don't follow proxy pattern

## Implementation Phases

### Phase 1: Critical Architecture Fixes (Priority: HIGH)

#### 1.1 Remove Git Write Operations from BFF
**Files to modify:**
- `bff/server/git_write_endpoints.py` - Remove or convert to proxy
- `bff/server/main.py` - Remove git write route registration

**Implementation:**
```python
# Convert git writes to proxy pattern
@router.post("/git/write/{operation}")
async def proxy_git_write(operation: str, request: Request):
    # Forward to backend
    backend_response = await forward_to_backend(f"/api/v1/git/{operation}", request)
    return backend_response
```

#### 1.2 Convert Story Generation to Backend Proxy
**Files to modify:**
- `bff/server/story_endpoints.py` - Convert to proxy pattern
- `bff/server/story_models.py` - Keep for request validation

**Implementation:**
```python
# Proxy story generation to backend
@router.post("/stories/generate")
async def proxy_story_generation(request: StoryGenerationRequest):
    # Forward to backend with SSE streaming
    return await stream_from_backend("/api/v1/generate/scene", request)
```

### Phase 2: API Contract Establishment (Priority: HIGH)

#### 2.1 Create Shared API Contracts
**Location:** `/home/tmcfar/dev/pw2/docs/api-contracts/`

**Files to create:**
- `git-operations.yaml` - Git read/write operations
- `story-generation.yaml` - Content generation endpoints
- `authentication.yaml` - Auth flow contracts
- `websocket-events.yaml` - Real-time event definitions

#### 2.2 Implement Contract Validation
- Add request/response validation in both services
- Use shared Pydantic models
- Implement contract testing

### Phase 3: Git-Native Architecture Enhancement (Priority: HIGH)

#### 3.1 Strict Read/Write Separation
**BFF (Read Path):**
- Maintain local git repository cache
- Implement efficient git pull synchronization
- Add cache invalidation on webhooks

**Backend (Write Path):**
- Centralize all git write operations
- Implement transaction-like commit handling
- Add pre-commit validation hooks

#### 3.2 Webhook Integration
**Implementation:**
- Configure GitHub/GitLab webhooks
- BFF webhook receiver triggers git pull
- Broadcast updates via WebSocket

### Phase 4: WebSocket Enhancement (Priority: MEDIUM)

#### 4.1 Unified WebSocket Protocol
**Define events:**
- `content.updated` - File content changes
- `project.locked` - Lock acquisition
- `user.presence` - Collaboration presence
- `generation.progress` - AI generation updates

#### 4.2 Connection Management
- Implement reconnection logic
- Add connection pooling
- Monitor WebSocket health

### Phase 5: Agent System Integration (Priority: MEDIUM)

#### 5.1 Agent Registration
- Create agent registry in backend
- Implement agent discovery mechanism
- Add agent health monitoring

#### 5.2 Agent Orchestration
- Build workflow engine
- Implement agent chaining
- Add cost tracking per agent

### Phase 6: Quality Gates Implementation (Priority: MEDIUM)

#### 6.1 Content Validation Pipeline
**Components:**
- Voice consistency analyzer
- Repetition detector
- Narrative continuity checker
- Style adherence validator

#### 6.2 Performance Monitoring
- Add response time tracking
- Monitor resource usage
- Implement circuit breakers

### Phase 7: Security Hardening (Priority: HIGH)

#### 7.1 Authentication Enhancement
- Implement refresh token rotation
- Add session management
- Enhance OAuth integration

#### 7.2 Authorization Layer
- Implement RBAC (Role-Based Access Control)
- Add project-level permissions
- Secure git repository access

### Phase 8: Monitoring Infrastructure (Priority: LOW)

#### 8.1 Observability
- Add OpenTelemetry instrumentation
- Implement distributed tracing
- Create dashboards

#### 8.2 Analytics
- Track user engagement metrics
- Monitor content quality scores
- Analyze cost per generation

## Implementation Timeline

### Week 1-2: Critical Fixes
- Remove git writes from BFF
- Convert story generation to proxy
- Fix test imports

### Week 3-4: API Contracts
- Define all contracts
- Implement validation
- Add contract tests

### Week 5-6: Git Architecture
- Enhance read/write separation
- Implement webhooks
- Optimize caching

### Week 7-8: Real-time & Agents
- Enhance WebSocket protocol
- Integrate agent system
- Add orchestration

### Week 9-10: Quality & Security
- Implement quality gates
- Harden security
- Add monitoring

## Testing Strategy

### Unit Tests
- Test each component in isolation
- Mock external dependencies
- Achieve 80% coverage

### Integration Tests
- Test service interactions
- Validate API contracts
- Test git operations

### End-to-End Tests
- Test complete workflows
- Validate real-time features
- Test authentication flows

## Migration Approach

### 1. Feature Flags
- Use flags for gradual rollout
- A/B test new implementations
- Quick rollback capability

### 2. Backward Compatibility
- Maintain old endpoints temporarily
- Provide migration guides
- Version APIs properly

### 3. Data Migration
- No data migration needed
- Git repositories remain unchanged
- User sessions preserved

## Success Metrics

### Technical Metrics
- Response time < 200ms for reads
- WebSocket latency < 50ms
- 99.9% uptime
- Zero data loss

### Business Metrics
- User satisfaction score > 4.5/5
- Content quality score > 85%
- Generation success rate > 95%
- Cost per generation < $0.10

## Risk Mitigation

### High Risks
1. **Service Communication Failure**
   - Mitigation: Circuit breakers, retries
   
2. **Git Synchronization Issues**
   - Mitigation: Conflict resolution, locks
   
3. **WebSocket Instability**
   - Mitigation: Reconnection logic, fallbacks

### Medium Risks
1. **Performance Degradation**
   - Mitigation: Caching, optimization
   
2. **Security Vulnerabilities**
   - Mitigation: Regular audits, updates

## Next Steps

1. **Immediate Actions:**
   - Create feature branch for BFF fixes
   - Set up API contract repository
   - Plan sprint for Phase 1

2. **Team Alignment:**
   - Review plan with team
   - Assign ownership per phase
   - Set up progress tracking

3. **Documentation:**
   - Update architecture diagrams
   - Create migration guides
   - Document new patterns

## Appendix: File Change Summary

### Files to Remove/Modify
- `bff/server/git_write_endpoints.py` - Remove
- `bff/server/story_endpoints.py` - Convert to proxy
- `*/test_*.py` - Fix FastAPI imports

### Files to Create
- `/pw2/docs/api-contracts/*.yaml` - API contracts
- `bff/server/proxy_utils.py` - Proxy helpers
- `bff/server/websocket_protocol.py` - Protocol definition

### Configuration Updates
- `docker-compose.yml` - Already updated
- Environment variables - Add contract paths
- Feature flags - Add migration flags

This plan provides a systematic approach to align the codebase with the intended architecture while minimizing disruption to existing functionality.