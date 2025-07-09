/**
 * Centralized API client for PlotWeaver frontend
 * Handles all API communication with proper authentication and error handling
 */

import { sessionManager } from '../analytics/sessionManager';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000; // 30 seconds

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  /**
   * Get authentication token from storage
   */
  private async getAuthToken(): Promise<string | null> {
    // Check various auth sources in order of preference
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('auth_token') ||
        this.getCookie('auth_token') ||
        null
      );
    }
    return null;
  }

  /**
   * Get cookie value by name
   */
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  /**
   * Create headers for API request
   */
  private async createHeaders(options?: ApiRequestOptions): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Session-ID': sessionManager.getSessionId(),
      ...options?.headers,
    };

    // Add auth token if available and not skipped
    if (!options?.skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Make an API request with proper error handling
   */
  private async request<T>(
    path: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, skipAuth, ...fetchOptions } = options;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const headers = await this.createHeaders(options);
      
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        throw new ApiError(response.status, response.statusText, errorData);
      }

      // Parse JSON response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return response.json();
      }

      // Return text for non-JSON responses
      return response.text() as any;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout');
      }
      
      // Re-throw API errors
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Wrap other errors
      throw new ApiError(0, 'Network error', error);
    }
  }

  // Event tracking endpoints
  async submitEventBatch(events: any[]): Promise<any> {
    return this.request('/api/v1/events/batch', {
      method: 'POST',
      body: JSON.stringify({ events }),
      skipAuth: true, // Events can be submitted anonymously
    });
  }

  // Feedback endpoints
  async submitFeedback(data: {
    feedbackType: string;
    contentType?: string;
    contentId?: string;
    projectId?: number;
    rating?: number;
    comment?: string;
    context?: Record<string, any>;
  }): Promise<any> {
    return this.request('/api/v1/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true, // Allow anonymous feedback
    });
  }

  async updateFeedback(data: {
    feedbackType: string;
    contentType?: string;
    contentId?: string;
    comment?: string;
    rating?: number;
    context?: Record<string, any>;
  }): Promise<any> {
    return this.request('/api/v1/feedback', {
      method: 'PATCH',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  }

  async submitSessionFeedback(data: {
    satisfaction: number;
    likelihoodToRecommend: number;
    biggestChallenge?: string;
    sessionDuration: number;
  }): Promise<any> {
    return this.request('/api/v1/feedback/session', {
      method: 'POST',
      body: JSON.stringify({
        feedbackType: 'session',
        context: data,
      }),
      skipAuth: true,
    });
  }

  async reportFriction(projectId: number, data: {
    contentType: string;
    contentId: string;
    regenerationCount: number;
    explanation?: string;
  }): Promise<any> {
    return this.request(`/api/v1/projects/${projectId}/feedback/friction`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Help content endpoints
  async getHelpContent(helpIds: string[]): Promise<any[]> {
    return this.request('/api/v1/help/bulk', {
      method: 'POST',
      body: JSON.stringify({ helpIds }),
      skipAuth: true,
    });
  }

  async searchHelp(query: string): Promise<any[]> {
    const params = new URLSearchParams({ q: query });
    return this.request(`/api/v1/help/search?${params}`, {
      skipAuth: true,
    });
  }

  async getHelpItem(helpId: string): Promise<any> {
    return this.request(`/api/v1/help/${helpId}`, {
      skipAuth: true,
    });
  }

  // Analytics endpoints (for development/admin)
  async getAnalyticsStats(): Promise<any> {
    return this.request('/api/v1/analytics/stats');
  }

  async getSessionEvents(sessionId: string): Promise<any> {
    return this.request(`/api/v1/analytics/events/${sessionId}`);
  }

  async getSessionFeedback(sessionId: string): Promise<any> {
    return this.request(`/api/v1/analytics/feedback/${sessionId}`);
  }

  // Mode set endpoints
  async getUserModeSet(): Promise<any> {
    return this.request('/api/user/mode-set', {
      skipAuth: true,
    });
  }

  async setUserModeSet(modeSetId: string): Promise<any> {
    return this.request('/api/user/mode-set', {
      method: 'POST',
      body: JSON.stringify({ modeSetId }),
      skipAuth: true,
    });
  }

  // Project endpoints
  async getProject(projectId: number): Promise<any> {
    return this.request(`/api/projects/${projectId}`);
  }

  async updateProject(projectId: number, data: any): Promise<any> {
    return this.request(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Lock management
  async getProjectLocks(projectId: string): Promise<any> {
    return this.request(`/api/projects/${projectId}/locks`);
  }

  async updateComponentLock(projectId: string, componentId: string, lock: any): Promise<any> {
    return this.request(`/api/projects/${projectId}/locks/${componentId}`, {
      method: 'PUT',
      body: JSON.stringify(lock),
    });
  }

  async bulkUpdateLocks(projectId: string, operations: any[]): Promise<any> {
    return this.request(`/api/projects/${projectId}/locks/bulk`, {
      method: 'POST',
      body: JSON.stringify({ operations }),
    });
  }

  async checkLockConflicts(projectId: string, components: string[]): Promise<any> {
    return this.request(`/api/projects/${projectId}/locks/check-conflicts`, {
      method: 'POST',
      body: JSON.stringify({ components }),
    });
  }

  // Git operations
  async getFileContent(projectId: string, filePath: string): Promise<any> {
    return this.request(`/api/git/content/${projectId}/${filePath}`);
  }

  async getProjectTree(projectId: string, path: string = ''): Promise<any> {
    const params = new URLSearchParams({ path });
    return this.request(`/api/git/tree/${projectId}?${params}`);
  }

  async getDiff(projectId: string, baseRef: string, headRef: string = 'HEAD'): Promise<any> {
    return this.request(`/api/git/diff/${projectId}/${baseRef}/${headRef}`);
  }

  async getFileHistory(projectId: string, filePath: string, limit: number = 10): Promise<any> {
    const params = new URLSearchParams({ limit: limit.toString() });
    return this.request(`/api/git/history/${projectId}/${filePath}?${params}`);
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request('/api/health', {
      skipAuth: true,
      timeout: 5000,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiClient };
