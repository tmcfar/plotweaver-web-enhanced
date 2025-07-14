/**
 * Authentication service for PlotWeaver
 * Handles all auth-related API calls to the Flask backend
 */

import axios from 'axios';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

// Flask backend runs on port 5000
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Auth routes that should not trigger redirects to prevent loops
const AUTH_PATHS = ['/(auth)/', '/login', '/api/auth/'];
const isAuthRoute = (pathname: string) => AUTH_PATHS.some(path => pathname.includes(path));

// Create dedicated auth client
const authClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for session management
});

// Add auth token to requests
authClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth responses
authClient.interceptors.response.use(
  (response) => {
    // Store token if present in response
    if (response.data?.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens on 401
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      // Prevent infinite redirect loop - only redirect if not already in auth flow
      if (!isAuthRoute(window.location.pathname)) {
        console.trace('Auth interceptor triggering redirect to /login');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await authClient.post('/api/v1/auth/register', data);
    return response.data;
  },

  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await authClient.post('/api/v1/auth/login', data);
    return response.data;
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await authClient.post('/api/v1/auth/logout');
    } finally {
      // Always clear local tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  },

  /**
   * Refresh access token
   */
  refresh: async (): Promise<AuthResponse> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await authClient.post('/api/v1/auth/refresh', {
      refresh_token: refreshToken
    });
    return response.data;
  },

  /**
   * Get current user info
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await authClient.get('/api/v1/auth/me');
    return response.data;
  },

  /**
   * OAuth login
   */
  oauthLogin: async (provider: 'github' | 'google', redirectUri: string) => {
    const response = await authClient.get(`/api/v1/auth/oauth/${provider}/authorize`, {
      params: { redirect_uri: redirectUri }
    });
    return response.data;
  },

  /**
   * OAuth callback
   */
  oauthCallback: async (provider: string, code: string, redirectUri: string): Promise<AuthResponse> => {
    const response = await authClient.post(`/api/v1/auth/oauth/${provider}/callback`, {
      code,
      redirect_uri: redirectUri
    });
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Get auth headers for manual requests
   */
  getAuthHeaders: (): Record<string, string> => {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

export default authService;
