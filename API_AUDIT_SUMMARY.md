# PlotWeaver API Usage Audit - Summary

## Quick Fix Available

Run the provided fix script to address immediate issues:
```bash
cd ~/dev/pw-web
chmod +x fix_api_integration.sh
./fix_api_integration.sh
```

## Key Findings

### 1. **Architecture Mismatch**
- Frontend calls APIs at wrong ports
- No separation between backend (5000) and BFF (8000) calls
- Worldbuilding components bypass API service layer

### 2. **Missing Implementations**
Frontend API service is missing:
- All worldbuilding endpoints
- All BFF-specific endpoints (locks, preview, git)
- Authentication endpoints
- User profile endpoints
- Billing endpoints

### 3. **Type Safety Gaps**
- Worldbuilding types imported but not used properly
- No types for enhanced locks, conflicts, git operations
- Missing error type definitions

### 4. **Documented but Not Used**
These APIs are documented but have no frontend integration:
- `/api/v1/auth/*` - Complete auth flow
- `/api/v1/billing/*` - Subscription management
- `/api/v1/user/profile` - User management
- `/api/v1/projects/{id}/secrets` - API key storage
- BFF preview endpoints
- BFF git integration
- Enhanced lock management
- Conflict resolution

### 5. **Incorrect API Patterns**

**Current (Wrong):**
```typescript
// Direct fetch in component
await fetch('/api/worldbuilding/analyze-concept', {...})
```

**Should Be:**
```typescript
// Through API service
await api.worldbuilding.analyzeConceptapi(data)
```

## Priority Actions

### P0 - Critical (Blocking)
1. ✅ Fix worldbuilding API URLs (script provided)
2. ✅ Create worldbuilding API service (script provided)
3. ❌ Update components to use API service (manual)

### P1 - High (Functionality)
1. ❌ Implement authentication flow
2. ❌ Add BFF endpoints to API service
3. ❌ Complete type definitions

### P2 - Medium (Enhancement)
1. ❌ Add billing integration
2. ❌ Implement user profile management
3. ❌ Add project secrets UI

## Compliance Score

| Component | Score | Notes |
|-----------|-------|-------|
| API Documentation | 100% | All endpoints documented |
| Backend Implementation | 85% | Most endpoints implemented |
| BFF Implementation | 90% | Core features complete |
| Frontend Integration | 40% | Many endpoints not connected |
| Type Safety | 60% | Partial type coverage |
| **Overall** | **75%** | Frontend integration is the gap |

## Recommendations

1. **Immediate**: Run the fix script and manually update components
2. **This Week**: Complete frontend API service implementation
3. **Next Sprint**: Add authentication and user management
4. **Future**: Generate API clients from OpenAPI specs

## Success Criteria

- [ ] All API calls go through centralized service
- [ ] Proper separation of backend vs BFF calls
- [ ] Full TypeScript type coverage
- [ ] No direct fetch() calls in components
- [ ] Environment-based API configuration
