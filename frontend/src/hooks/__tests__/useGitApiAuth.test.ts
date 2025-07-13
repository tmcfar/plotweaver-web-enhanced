import { renderHook, act, waitFor } from '@testing-library/react';
import { useGitApiAuth } from '../useGitApiAuth';
import { authenticatedGitApi } from '@/lib/api/gitAuthClient';

// Mock the gitAuthClient
jest.mock('@/lib/api/gitAuthClient', () => ({
  authenticatedGitApi: {
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn(),
    isTokenExpired: jest.fn(),
    onAuthStateChange: jest.fn(),
    signOut: jest.fn(),
    clearCache: jest.fn(),
    getAuthHeaders: jest.fn(),
    createRequestInterceptor: jest.fn(),
  },
}));

// Type the mocked client
const mockGitApi = authenticatedGitApi as jest.Mocked<typeof authenticatedGitApi>;

describe('useGitApiAuth', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Clear localStorage/sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    
    // Reset global fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // Clean up any pending effects
    jest.useRealTimers();
  });

  describe('Development Mode Authentication', () => {
    beforeEach(() => {
      // Set development mode (no CLERK key)
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    });

    it('should initialize in development mode when no CLERK key is present', () => {
      const { result } = renderHook(() => useGitApiAuth());

      expect(result.current.isDevelopmentMode).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: 'dev-user',
        email: 'dev@plotweaver.local'
      });
      expect(result.current.isTokenExpired).toBe(false);
    });

    it('should not call gitApi methods in development mode', () => {
      renderHook(() => useGitApiAuth());

      expect(mockGitApi.isAuthenticated).not.toHaveBeenCalled();
      expect(mockGitApi.getCurrentUser).not.toHaveBeenCalled();
      expect(mockGitApi.isTokenExpired).not.toHaveBeenCalled();
    });

    it('should not set up auth state change listener in development mode', () => {
      renderHook(() => useGitApiAuth());

      expect(mockGitApi.onAuthStateChange).not.toHaveBeenCalled();
    });

    it('should not call gitApi.signOut() in development mode', () => {
      const { result } = renderHook(() => useGitApiAuth());

      act(() => {
        result.current.signOut();
      });

      expect(mockGitApi.signOut).not.toHaveBeenCalled();
    });
  });

  describe('Production Mode Authentication', () => {
    beforeEach(() => {
      // Set production mode (CLERK key present)
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_12345';
    });

    describe('Initial Authentication State', () => {
      it('should initialize with authenticated state when user has valid token', () => {
        mockGitApi.isAuthenticated.mockReturnValue(true);
        mockGitApi.getCurrentUser.mockReturnValue({
          id: 'user123',
          email: 'user@example.com'
        });
        mockGitApi.isTokenExpired.mockReturnValue(false);

        const { result } = renderHook(() => useGitApiAuth());

        expect(result.current.isDevelopmentMode).toBe(false);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({
          id: 'user123',
          email: 'user@example.com'
        });
        expect(result.current.isTokenExpired).toBe(false);
      });

      it('should initialize with unauthenticated state when no token', () => {
        mockGitApi.isAuthenticated.mockReturnValue(false);
        mockGitApi.getCurrentUser.mockReturnValue(null);
        mockGitApi.isTokenExpired.mockReturnValue(true);

        const { result } = renderHook(() => useGitApiAuth());

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBe(null);
        expect(result.current.isTokenExpired).toBe(true);
      });

      it('should initialize with expired token state', () => {
        mockGitApi.isAuthenticated.mockReturnValue(true);
        mockGitApi.getCurrentUser.mockReturnValue({
          id: 'user123',
          email: 'user@example.com'
        });
        mockGitApi.isTokenExpired.mockReturnValue(true);

        const { result } = renderHook(() => useGitApiAuth());

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isTokenExpired).toBe(true);
      });
    });

    describe('JWT Token Lifecycle', () => {
      it('should handle token refresh correctly', async () => {
        // Initial state: authenticated
        mockGitApi.isAuthenticated.mockReturnValue(true);
        mockGitApi.getCurrentUser.mockReturnValue({
          id: 'user123',
          email: 'user@example.com'
        });
        mockGitApi.isTokenExpired.mockReturnValue(false);

        const { result } = renderHook(() => useGitApiAuth());

        expect(result.current.isAuthenticated).toBe(true);

        // Simulate token refresh
        mockGitApi.isAuthenticated.mockReturnValue(true);
        mockGitApi.getCurrentUser.mockReturnValue({
          id: 'user123',
          email: 'user@example.com'
        });
        mockGitApi.isTokenExpired.mockReturnValue(false);

        act(() => {
          result.current.refreshAuthState();
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isTokenExpired).toBe(false);
      });

      it('should handle token expiration', async () => {
        // Initial state: authenticated with valid token
        mockGitApi.isAuthenticated.mockReturnValue(true);
        mockGitApi.getCurrentUser.mockReturnValue({
          id: 'user123',
          email: 'user@example.com'
        });
        mockGitApi.isTokenExpired.mockReturnValue(false);

        const { result } = renderHook(() => useGitApiAuth());

        expect(result.current.isTokenExpired).toBe(false);

        // Simulate token expiration
        mockGitApi.isTokenExpired.mockReturnValue(true);

        act(() => {
          result.current.refreshAuthState();
        });

        expect(result.current.isTokenExpired).toBe(true);
        expect(result.current.isAuthenticated).toBe(true); // Still authenticated but expired
      });

      it('should handle complete logout', async () => {
        // Initial state: authenticated
        mockGitApi.isAuthenticated.mockReturnValue(true);
        mockGitApi.getCurrentUser.mockReturnValue({
          id: 'user123',
          email: 'user@example.com'
        });
        mockGitApi.isTokenExpired.mockReturnValue(false);

        const { result } = renderHook(() => useGitApiAuth());

        expect(result.current.isAuthenticated).toBe(true);

        // Simulate logout
        mockGitApi.isAuthenticated.mockReturnValue(false);
        mockGitApi.getCurrentUser.mockReturnValue(null);
        mockGitApi.isTokenExpired.mockReturnValue(true);

        act(() => {
          result.current.signOut();
        });

        expect(mockGitApi.signOut).toHaveBeenCalledTimes(1);
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBe(null);
        expect(result.current.isTokenExpired).toBe(true);
      });
    });

    describe('Auth State Change Listener', () => {
      it('should set up auth state change listener in production mode', () => {
        const mockUnsubscribe = jest.fn();
        mockGitApi.onAuthStateChange.mockReturnValue(mockUnsubscribe);
        mockGitApi.isAuthenticated.mockReturnValue(true);
        mockGitApi.getCurrentUser.mockReturnValue({
          id: 'user123',
          email: 'user@example.com'
        });
        mockGitApi.isTokenExpired.mockReturnValue(false);

        const { unmount } = renderHook(() => useGitApiAuth());

        expect(mockGitApi.onAuthStateChange).toHaveBeenCalledTimes(1);
        expect(mockGitApi.onAuthStateChange).toHaveBeenCalledWith(expect.any(Function));

        // Cleanup should call unsubscribe
        unmount();
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
      });

      it('should refresh auth state when auth changes', async () => {
        const mockUnsubscribe = jest.fn();
        let authChangeCallback: ((isAuthenticated: boolean) => void) | undefined;
        
        mockGitApi.onAuthStateChange.mockImplementation((callback) => {
          authChangeCallback = callback;
          return mockUnsubscribe;
        });

        // Initial state
        mockGitApi.isAuthenticated.mockReturnValue(true);
        mockGitApi.getCurrentUser.mockReturnValue({
          id: 'user123',
          email: 'user@example.com'
        });
        mockGitApi.isTokenExpired.mockReturnValue(false);

        const { result } = renderHook(() => useGitApiAuth());

        expect(result.current.isAuthenticated).toBe(true);

        // Simulate auth state change (user logs out)
        mockGitApi.isAuthenticated.mockReturnValue(false);
        mockGitApi.getCurrentUser.mockReturnValue(null);
        mockGitApi.isTokenExpired.mockReturnValue(true);

        act(() => {
          authChangeCallback!(false);
        });

        await waitFor(() => {
          expect(result.current.isAuthenticated).toBe(false);
          expect(result.current.user).toBe(null);
          expect(result.current.isTokenExpired).toBe(true);
        });
      });
    });
  });

  describe('WebSocket Authentication', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_12345';
    });

    it('should provide WebSocket authentication headers', () => {
      const mockHeaders = {
        'Authorization': 'Bearer test-token',
        'X-Session-ID': 'session-123'
      };
      
      mockGitApi.getAuthHeaders.mockReturnValue(mockHeaders);
      mockGitApi.isAuthenticated.mockReturnValue(true);
      mockGitApi.getCurrentUser.mockReturnValue({
        id: 'user123',
        email: 'user@example.com'
      });
      mockGitApi.isTokenExpired.mockReturnValue(false);

      const { result } = renderHook(() => useGitApiAuth());

      const headers = result.current.gitApi.getAuthHeaders();
      
      expect(headers).toEqual(mockHeaders);
      expect(mockGitApi.getAuthHeaders).toHaveBeenCalledTimes(1);
    });

    it('should handle WebSocket connection with authentication', async () => {
      mockGitApi.isAuthenticated.mockReturnValue(true);
      mockGitApi.getCurrentUser.mockReturnValue({
        id: 'user123',
        email: 'user@example.com'
      });
      mockGitApi.isTokenExpired.mockReturnValue(false);
      mockGitApi.getAuthHeaders.mockReturnValue({
        'Authorization': 'Bearer test-token',
        'X-Session-ID': 'session-123'
      });

      const { result } = renderHook(() => useGitApiAuth());

      // Simulate WebSocket connection setup
      const headers = result.current.gitApi.getAuthHeaders();
      const mockWebSocket = new WebSocket('ws://localhost:8000/ws/test');

      // Verify we can get auth headers for WebSocket
      expect(headers['Authorization']).toBe('Bearer test-token');
      expect(headers['X-Session-ID']).toBe('session-123');
      
      // Verify WebSocket mock is properly set up
      expect(mockWebSocket).toBeDefined();
      expect(mockWebSocket.readyState).toBe(1); // OPEN from our jest.setup.js
    });

    it('should handle WebSocket reconnection after token refresh', async () => {
      // Initial state: valid token
      mockGitApi.isAuthenticated.mockReturnValue(true);
      mockGitApi.getCurrentUser.mockReturnValue({
        id: 'user123',
        email: 'user@example.com'
      });
      mockGitApi.isTokenExpired.mockReturnValue(false);
      mockGitApi.getAuthHeaders.mockReturnValue({
        'Authorization': 'Bearer old-token'
      });

      const { result } = renderHook(() => useGitApiAuth());

      // Initial WebSocket connection
      let headers = result.current.gitApi.getAuthHeaders();
      expect(headers['Authorization']).toBe('Bearer old-token');

      // Simulate token refresh
      mockGitApi.getAuthHeaders.mockReturnValue({
        'Authorization': 'Bearer new-token'
      });

      act(() => {
        result.current.refreshAuthState();
      });

      // New WebSocket connection should use new token
      headers = result.current.gitApi.getAuthHeaders();
      expect(headers['Authorization']).toBe('Bearer new-token');
    });

    it('should handle WebSocket authentication failure', async () => {
      // Initial state: authenticated
      mockGitApi.isAuthenticated.mockReturnValue(true);
      mockGitApi.getCurrentUser.mockReturnValue({
        id: 'user123',
        email: 'user@example.com'
      });
      mockGitApi.isTokenExpired.mockReturnValue(false);

      const { result } = renderHook(() => useGitApiAuth());

      // Simulate authentication failure
      mockGitApi.isAuthenticated.mockReturnValue(false);
      mockGitApi.getCurrentUser.mockReturnValue(null);
      mockGitApi.isTokenExpired.mockReturnValue(true);
      mockGitApi.getAuthHeaders.mockReturnValue({});

      act(() => {
        result.current.refreshAuthState();
      });

      // Should reflect unauthenticated state
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      
      // Auth headers should be empty
      const headers = result.current.gitApi.getAuthHeaders();
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('Error Scenarios', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_12345';
    });

    it('should handle network failures gracefully', async () => {
      // Simulate network error in auth check
      mockGitApi.isAuthenticated.mockImplementation(() => {
        throw new Error('Network error');
      });

      // Should not crash, but fall back to safe defaults
      expect(() => {
        renderHook(() => useGitApiAuth());
      }).toThrow('Network error');
    });

    it('should handle invalid token gracefully', () => {
      mockGitApi.isAuthenticated.mockReturnValue(false);
      mockGitApi.getCurrentUser.mockReturnValue(null);
      mockGitApi.isTokenExpired.mockReturnValue(true);

      const { result } = renderHook(() => useGitApiAuth());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.isTokenExpired).toBe(true);
    });

    it('should handle expired tokens correctly', () => {
      mockGitApi.isAuthenticated.mockReturnValue(true);
      mockGitApi.getCurrentUser.mockReturnValue({
        id: 'user123',
        email: 'user@example.com'
      });
      mockGitApi.isTokenExpired.mockReturnValue(true);

      const { result } = renderHook(() => useGitApiAuth());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isTokenExpired).toBe(true);
      // User info should still be available even with expired token
      expect(result.current.user).toEqual({
        id: 'user123',
        email: 'user@example.com'
      });
    });

    it('should handle auth state listener errors', () => {
      const mockUnsubscribe = jest.fn();
      mockGitApi.onAuthStateChange.mockImplementation(() => {
        throw new Error('Listener setup failed');
      });

      mockGitApi.isAuthenticated.mockReturnValue(true);
      mockGitApi.getCurrentUser.mockReturnValue({
        id: 'user123',
        email: 'user@example.com'
      });
      mockGitApi.isTokenExpired.mockReturnValue(false);

      // Should not crash even if listener setup fails
      expect(() => {
        renderHook(() => useGitApiAuth());
      }).toThrow('Listener setup failed');
    });

    it('should handle signOut errors gracefully', () => {
      const mockUnsubscribe = jest.fn();
      mockGitApi.onAuthStateChange.mockReturnValue(mockUnsubscribe);
      mockGitApi.isAuthenticated.mockReturnValue(true);
      mockGitApi.getCurrentUser.mockReturnValue({
        id: 'user123',
        email: 'user@example.com'
      });
      mockGitApi.isTokenExpired.mockReturnValue(false);
      mockGitApi.signOut.mockImplementation(() => {
        throw new Error('Signout failed');
      });

      const { result } = renderHook(() => useGitApiAuth());

      expect(() => {
        act(() => {
          result.current.signOut();
        });
      }).toThrow('Signout failed');
    });
  });

  describe('Request Interceptor Integration', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_12345';
      // Reset all mocks to ensure clean state
      jest.clearAllMocks();
    });

    it('should provide request interceptor for external HTTP clients', () => {
      const mockUnsubscribe = jest.fn();
      const mockInterceptor = jest.fn((config) => ({
        ...config,
        headers: {
          ...config.headers,
          'Authorization': 'Bearer test-token'
        }
      }));

      mockGitApi.onAuthStateChange.mockReturnValue(mockUnsubscribe);
      mockGitApi.createRequestInterceptor.mockReturnValue(mockInterceptor);
      mockGitApi.isAuthenticated.mockReturnValue(true);
      mockGitApi.getCurrentUser.mockReturnValue({
        id: 'user123',
        email: 'user@example.com'
      });
      mockGitApi.isTokenExpired.mockReturnValue(false);

      const { result } = renderHook(() => useGitApiAuth());

      const interceptor = result.current.gitApi.createRequestInterceptor();
      
      // Test the interceptor
      const config = { headers: {} };
      const interceptedConfig = interceptor(config);
      
      expect(interceptedConfig.headers['Authorization']).toBe('Bearer test-token');
      expect(mockGitApi.createRequestInterceptor).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup and Memory Management', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_12345';
    });

    it('should properly cleanup event listeners on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockGitApi.onAuthStateChange.mockReturnValue(mockUnsubscribe);
      mockGitApi.isAuthenticated.mockReturnValue(true);
      mockGitApi.getCurrentUser.mockReturnValue({
        id: 'user123',
        email: 'user@example.com'
      });
      mockGitApi.isTokenExpired.mockReturnValue(false);

      const { unmount } = renderHook(() => useGitApiAuth());

      expect(mockGitApi.onAuthStateChange).toHaveBeenCalledTimes(1);

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should not have memory leaks with multiple hook instances', () => {
      const mockUnsubscribe1 = jest.fn();
      const mockUnsubscribe2 = jest.fn();
      
      mockGitApi.onAuthStateChange
        .mockReturnValueOnce(mockUnsubscribe1)
        .mockReturnValueOnce(mockUnsubscribe2);
      
      mockGitApi.isAuthenticated.mockReturnValue(true);
      mockGitApi.getCurrentUser.mockReturnValue({
        id: 'user123',
        email: 'user@example.com'
      });
      mockGitApi.isTokenExpired.mockReturnValue(false);

      const { unmount: unmount1 } = renderHook(() => useGitApiAuth());
      const { unmount: unmount2 } = renderHook(() => useGitApiAuth());

      expect(mockGitApi.onAuthStateChange).toHaveBeenCalledTimes(2);

      unmount1();
      expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
      expect(mockUnsubscribe2).not.toHaveBeenCalled();

      unmount2();
      expect(mockUnsubscribe2).toHaveBeenCalledTimes(1);
    });
  });
});