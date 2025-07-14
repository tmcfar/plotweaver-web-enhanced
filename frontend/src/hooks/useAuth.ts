import { useEffect, useState, useCallback } from 'react';
import authService from '@/services/auth';
import type { User, LoginRequest, RegisterRequest } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: authService.isAuthenticated(),
    isLoading: true,
    error: null,
  });

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser();
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          // Token might be invalid
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authService.login(credentials);
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return response;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.error || 'Login failed',
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authService.register(data);
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return response;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.error || 'Registration failed',
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.logout();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Even if logout fails on server, clear local state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const oauthLogin = useCallback(async (provider: 'github' | 'google') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
      const { authorization_url } = await authService.oauthLogin(provider, redirectUri);
      window.location.href = authorization_url;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.error || 'OAuth login failed',
      }));
      throw error;
    }
  }, []);

  const handleOAuthCallback = useCallback(async (provider: string, code: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
      const response = await authService.oauthCallback(provider, code, redirectUri);
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return response;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.error || 'OAuth callback failed',
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    oauthLogin,
    handleOAuthCallback,
  };
}

export default useAuth;
