# GitHub OAuth Implementation Audit

**Date:** 2025-07-13  
**Repository:** PlotWeaver Frontend (`~/dev/pw-web/frontend`)

## Executive Summary

The PlotWeaver frontend has a **partially implemented** GitHub OAuth system with significant issues preventing it from working correctly. The implementation exists but is broken due to configuration gaps and duplicate callback routes.

## OAuth-Related Files Found

### 1. Callback Pages (DUPLICATE ROUTES)
- **`/app/auth/github/callback/page.tsx`** - Missing development mode handling
- **`/app/(auth)/github/callback/page.tsx`** - Has development mode handling
- **Status:** 🔴 BROKEN - Duplicate routes causing conflicts

### 2. User Profile Components
- **`/src/components/profile/UserProfile.tsx`** - OAuth initiation logic
- **`/src/components/profile/UserProfileImplementation.tsx`** - Alternative implementation
- **Status:** 🟡 PARTIAL - Contains GitHub connect/disconnect logic

### 3. Type Definitions
- **`/src/types/auth.ts`** - OAuth provider interface
- **Status:** ✅ COMPLETE - Proper TypeScript definitions

### 4. API Integration
- **`/src/lib/api/projects.ts`** - Project creation with GitHub repo option
- **`/src/services/api.ts`** - API service definitions
- **Status:** 🟡 PARTIAL - Placeholder implementations

### 5. Configuration Files
- **`.env.example`** - Complete GitHub OAuth configuration template
- **`.env.local`** - Missing GitHub OAuth configuration
- **Status:** 🔴 BROKEN - Missing required environment variables

## Current OAuth Flow Analysis

### **Initiation Flow:**
```
UserProfile Component → handleGitHubConnect() → GitHub OAuth URL
```

**Issues Found:**
- ❌ `NEXT_PUBLIC_GITHUB_CLIENT_ID` not defined in `.env.local`
- ❌ OAuth initiation fails due to missing client ID
- ❌ Redirect URI hardcoded to `/auth/github/callback`

### **Callback Flow:**
```
GitHub → /auth/github/callback → Backend API → Profile Page
```

**Issues Found:**
- ❌ Two different callback routes exist
- ❌ Backend endpoint `/api/v1/users/github/connect` likely doesn't exist
- ❌ API calls to `localhost:5000` (wrong port based on architecture docs)

### **Token Storage:**
- 🔍 **NOT IMPLEMENTED** - No token storage mechanism found
- 🔍 **NOT IMPLEMENTED** - No auth state management

## Detailed File Analysis

### `/app/auth/github/callback/page.tsx`
**Purpose:** Handle GitHub OAuth callback  
**Status:** 🔴 BROKEN
**Issues:**
- No development mode handling
- Direct API call without auth headers
- Error handling redirects to profile page

### `/app/(auth)/github/callback/page.tsx`  
**Purpose:** Alternative GitHub OAuth callback with dev mode  
**Status:** 🟡 PARTIALLY WORKING
**Features:**
- ✅ Development mode skip logic
- ✅ Better error handling
- ✅ Toast notifications
- ❌ Still calls non-existent backend endpoint

### UserProfile Components
**Purpose:** GitHub integration UI and connection logic  
**Status:** 🟡 PARTIALLY WORKING
**Features:**
- ✅ Connect/disconnect buttons
- ✅ Repository listing placeholder
- ✅ GitHub username display
- ❌ Environment variable dependency not met
- ❌ Backend API calls will fail

## Configuration Issues

### Missing Environment Variables
```bash
# Required but missing in .env.local:
NEXT_PUBLIC_GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
```

### Port Configuration Conflicts
- **Frontend calls:** `localhost:5000` (Backend)
- **Architecture docs:** Backend on `5000`, BFF on `8000`
- **Issue:** OAuth should likely go through BFF, not Backend

## Backend Integration Issues

### Expected Backend Endpoints
```
POST /api/v1/users/github/connect     # OAuth callback handler
POST /api/v1/users/github/disconnect  # Disconnect GitHub
GET  /api/v1/users/repositories       # List user repositories
```

**Status:** 🔴 ASSUMED NOT IMPLEMENTED
- Connection test page shows 404 for `/api/bff/auth/providers`
- No evidence these endpoints exist in Backend

## What's Working vs Broken

### ✅ Working
- TypeScript interfaces and types
- UI components render correctly
- Development mode bypass logic
- Basic OAuth URL construction (when env vars present)

### 🔴 Broken
- **Environment configuration** - Missing GitHub Client ID
- **Duplicate callback routes** - Route conflicts
- **Backend integration** - Non-existent API endpoints  
- **OAuth flow** - Fails at every step due to above issues
- **Token management** - No implementation found

### 🟡 Partially Working
- UI components (will render but won't function)
- OAuth initiation logic (missing env vars)
- Error handling and user feedback

## Recommended Fixes

### Priority 1: Configuration
1. **Add missing environment variables** to `.env.local`
2. **Register GitHub OAuth App** and get real client ID/secret
3. **Remove duplicate callback route** - keep the one with dev mode handling

### Priority 2: Backend Integration  
1. **Verify backend endpoints exist** or implement them
2. **Update API URLs** to match architecture (BFF vs Backend)
3. **Add authentication headers** to API calls

### Priority 3: Implementation Completion
1. **Add token storage** mechanism (localStorage/cookies)
2. **Implement auth state management** 
3. **Add proper error boundaries**
4. **Test OAuth flow end-to-end**

## Security Considerations

### Current Issues
- ❌ Client secret not properly secured (should be backend-only)
- ❌ No CSRF protection visible
- ❌ No token validation
- ❌ Credentials exposed in frontend code

### Recommendations
- Move OAuth secret handling to backend/BFF
- Implement proper CSRF tokens
- Add token refresh mechanism
- Secure credential storage

## Implementation Effort Estimate

**Current State:** ~30% complete  
**To Working MVP:** 2-3 days  
**To Production Ready:** 1 week

**Immediate blockers:**
1. Missing environment configuration (30 minutes)
2. Backend API endpoints (1-2 days)
3. Route conflicts (30 minutes)

## Next Steps

1. **Immediate:** Fix environment configuration and duplicate routes
2. **Short-term:** Verify/implement backend OAuth endpoints  
3. **Medium-term:** Complete token management and auth state
4. **Long-term:** Security hardening and production deployment

---

**Audit completed by:** Claude Code CLI  
**Last updated:** 2025-07-13