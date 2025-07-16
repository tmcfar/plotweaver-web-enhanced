# GitHub Issues for PlotWeaver Health Assessment

Generated from health assessment on July 14, 2025

## 🚨 Critical Issues (Priority 1)

### Issue 1: Frontend Build Failure - Service Worker Manifest
```bash
gh issue create \
  --title "🚨 CRITICAL: Frontend build failing due to service worker manifest" \
  --label "bug,critical,frontend,build" \
  --assignee "@me" \
  --body "**Impact**: Blocks all frontend development and deployment

**Error**: \`Can't find self.__WB_MANIFEST in your SW source\`

**Steps to Reproduce**:
1. Run \`cd frontend && npm run build\`
2. Build fails with service worker manifest error

**Expected Behavior**: Frontend should build successfully

**Current Status**: 
- Frontend service cannot start
- Development workflow blocked
- Deployment impossible

**Action Items**:
- [ ] Investigate service worker configuration in next.config.js
- [ ] Check workbox configuration
- [ ] Fix manifest generation or disable if not needed
- [ ] Verify build completes successfully
- [ ] Start frontend dev server on port 3000

**Priority**: Critical - must fix before any other frontend work"
```

### Issue 2: TypeScript Compilation Errors
```bash
gh issue create \
  --title "🚨 CRITICAL: 50+ TypeScript compilation errors preventing builds" \
  --label "bug,critical,frontend,typescript" \
  --assignee "@me" \
  --body "**Impact**: Prevents builds, affects IDE experience, blocks development

**Current State**: 50+ TypeScript errors across multiple files

**Major Error Categories**:
- Type mismatches in PerformancePanel.tsx
- Missing exports in test files  
- Hook dependency issues
- API interface mismatches
- Component prop type errors

**High-Priority Files**:
- \`src/components/PerformancePanel.tsx\` (Type 'unknown' not assignable)
- \`src/components/advanced/ContextBuilder.tsx\` (Block-scoped variable issues)
- \`src/lib/api/*.ts\` (API interface mismatches)
- Test files (Missing exports, type conversions)

**Action Items**:
- [ ] Fix PerformancePanel.tsx type issues
- [ ] Resolve ContextBuilder.tsx scoping problems
- [ ] Update API interface types
- [ ] Fix test file exports and mocks
- [ ] Run incremental type checking
- [ ] Achieve clean TypeScript compilation

**Acceptance Criteria**: \`npm run type-check\` passes with zero errors"
```

### Issue 3: Backend Infrastructure Issues
```bash
gh issue create \
  --title "⚠️ Backend service reporting degraded status due to infrastructure issues" \
  --label "bug,backend,infrastructure" \
  --assignee "@me" \
  --body "**Impact**: Service degradation, potential data consistency issues

**Current Status**: Backend reports 'degraded' status

**Issues Identified**:
- Redis connection reported as 'unhealthy' (despite container running)
- Database connection status 'unknown'
- System health endpoint shows degraded state

**Service Details**:
- Backend container: \`plotweaver-backend\` (running)
- Redis container: \`plotweaver-redis\` (healthy)
- PostgreSQL container: \`plotweaver-postgres\` (healthy)
- Backend health endpoint: http://localhost:5000/api/v1/system/health

**Action Items**:
- [ ] Investigate Redis connection configuration
- [ ] Verify database connectivity from backend
- [ ] Check service discovery/networking
- [ ] Review backend health check logic
- [ ] Ensure all services report 'healthy' status

**Expected Outcome**: Backend system health shows 'healthy' status"
```

## ⚠️ Moderate Issues (Priority 2)

### Issue 4: Test Coverage Below Standards
```bash
gh issue create \
  --title "📊 Test coverage significantly below standards (BFF: 0%, Frontend: unmeasurable)" \
  --label "enhancement,testing,quality" \
  --assignee "@me" \
  --body "**Current State**: 
- BFF test coverage: 0% (target: 70%)
- Frontend test coverage: Cannot measure due to build issues

**Impact**: 
- Deployment risk due to lack of test validation
- Difficult to catch regressions
- CI/CD pipeline incomplete

**Current Test Status**:
- BFF: 176 tests collected, 7 health tests passing
- Frontend: Some tests passing but coverage not measured

**Action Items**:
- [ ] Increase BFF test coverage to >70%
- [ ] Fix frontend test environment
- [ ] Add integration tests
- [ ] Set up coverage reporting
- [ ] Add critical component tests
- [ ] Implement API endpoint tests

**Success Criteria**: 
- BFF coverage >70%
- Frontend coverage >50%
- Coverage reports in CI/CD"
```

### Issue 5: Code Quality Issues - ESLint Warnings
```bash
gh issue create \
  --title "🧹 Code quality: 14 ESLint warnings (React Hook dependencies)" \
  --label "enhancement,code-quality,frontend" \
  --assignee "@me" \
  --body "**Impact**: Code quality issues, potential runtime bugs

**Current Issues**: 14 ESLint warnings related to React Hook dependencies

**Affected Files**:
- \`app/dev/connection-test/page.tsx\`
- \`src/components/advanced/CommandPalette.tsx\`
- \`src/components/profile/UserProfile.tsx\`
- \`src/components/project/ProjectSecretsManager.tsx\`
- \`src/hooks/useGitApi.ts\`
- \`src/hooks/useOfflineSync.ts\`
- \`src/hooks/useOptimisticLocks.ts\`
- \`src/hooks/useWebSocket.ts\`

**Issue Pattern**: 
\`React Hook useEffect has a missing dependency: 'functionName'. Either include it or remove the dependency array.\`

**Action Items**:
- [ ] Review and fix missing dependencies
- [ ] Use useCallback for stable function references
- [ ] Add proper dependency arrays
- [ ] Run \`npm run lint -- --fix\` where possible
- [ ] Verify no runtime issues introduced

**Success Criteria**: Zero ESLint warnings"
```

## 🔧 Enhancement Issues (Priority 3)

### Issue 6: Service Integration Monitoring
```bash
gh issue create \
  --title "📊 Implement comprehensive service health monitoring dashboard" \
  --label "enhancement,monitoring,devops" \
  --assignee "@me" \
  --body "**Objective**: Create comprehensive health monitoring for all services

**Current Limitations**:
- Limited health check endpoints
- No centralized monitoring dashboard
- Manual health assessment required

**Proposed Features**:
- Real-time service status dashboard
- Automated health checks
- Dependency monitoring
- Performance metrics
- Alert system for service degradation

**Implementation Plan**:
- [ ] Design health monitoring API
- [ ] Create centralized health dashboard
- [ ] Add service dependency checks
- [ ] Implement automated alerts
- [ ] Add performance metrics
- [ ] Create troubleshooting guides

**Benefits**:
- Proactive issue detection
- Faster incident response
- Better system reliability
- Improved developer experience"
```

### Issue 7: API Documentation and Contract Testing
```bash
gh issue create \
  --title "📚 Enhance API documentation and implement contract testing" \
  --label "enhancement,documentation,api" \
  --assignee "@me" \
  --body "**Objective**: Improve API documentation and add contract testing

**Current State**:
- BFF has 51 documented endpoints via Swagger
- Frontend/Backend contract validation manual
- No automated contract testing

**Proposed Improvements**:
- Enhanced API documentation with examples
- Automated contract testing
- API versioning strategy
- Breaking change detection
- Integration test automation

**Action Items**:
- [ ] Enhance Swagger documentation with examples
- [ ] Add request/response examples
- [ ] Implement contract testing framework
- [ ] Add API versioning headers
- [ ] Create breaking change detection
- [ ] Set up automated integration tests

**Success Criteria**:
- Complete API documentation with examples
- Automated contract validation
- Zero API integration issues"
```

## 📋 **Usage Instructions**

### To create all issues:
```bash
# Make this file executable and run
chmod +x create-github-issues.sh

# Or run each gh command individually
# Copy and paste each command block above
```

### To track progress:
```bash
# View open health-related issues
gh issue list --label "health-assessment" --state open

# View critical issues
gh issue list --label "critical" --state open

# Close an issue when fixed
gh issue close [issue-number] --comment "Fixed in commit [commit-hash]"
```

### Labels used:
- `bug` - Something is broken
- `critical` - Blocks development/deployment
- `enhancement` - Improvement or new feature
- `frontend` - Frontend-specific issue
- `backend` - Backend-specific issue
- `testing` - Test-related issue
- `quality` - Code quality issue
- `monitoring` - Monitoring/observability
- `api` - API-related issue
- `health-assessment` - Issues from this assessment

---

This creates a systematic tracking system for all identified issues, with clear priorities and actionable descriptions.