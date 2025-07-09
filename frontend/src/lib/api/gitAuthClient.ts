import GitApiClient from './git';

/**
 * Authentication-aware Git API client that integrates with the existing
 * PlotWeaver authentication system and follows established patterns.
 */
export class AuthenticatedGitApiClient extends GitApiClient {
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getAuthToken() !== null;
  }

  /**
   * Get current user information from token if available
   */
  getCurrentUser(): { id?: string; email?: string } | null {
    const token = this.getAuthToken();
    if (!token) return null;

    try {
      // Decode JWT token payload (basic decoding, no verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub || payload.user_id,
        email: payload.email || payload.username
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getAuthToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  /**
   * Handle authentication state changes
   */
  onAuthStateChange(callback: (isAuthenticated: boolean) => void): () => void {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        callback(this.isAuthenticated());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }

  /**
   * Sign out and clear all cached data
   */
  signOut(): void {
    // Clear authentication tokens
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    // Clear cookies
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Clear all git cache
    this.clearCache();
    
    // Clear session data
    sessionStorage.removeItem('plotweaver_session_id');
  }

  /**
   * Get authentication headers for manual requests
   */
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const sessionId = this.getSessionId();
    if (sessionId) {
      headers['X-Session-ID'] = sessionId;
    }

    return headers;
  }

  /**
   * Create a request interceptor for external HTTP clients
   */
  createRequestInterceptor() {
    return (config: any) => {
      const authHeaders = this.getAuthHeaders();
      config.headers = { ...config.headers, ...authHeaders };
      return config;
    };
  }

  // Make protected methods accessible
  protected getAuthToken(): string | null {
    return super['getAuthToken']();
  }

  protected getSessionId(): string | null {
    return super['getSessionId']();
  }
}

// Export singleton instance
export const authenticatedGitApi = new AuthenticatedGitApiClient();

export default AuthenticatedGitApiClient;