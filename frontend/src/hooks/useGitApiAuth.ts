import { useEffect, useState } from 'react';
import { authenticatedGitApi } from '@/lib/api/gitAuthClient';

interface GitAuthState {
  isAuthenticated: boolean;
  user: { id?: string; email?: string } | null;
  isTokenExpired: boolean;
  isDevelopmentMode: boolean;
}

/**
 * Hook that provides git API authentication state and integrates
 * with the existing PlotWeaver authentication patterns.
 */
export function useGitApiAuth(): GitAuthState & {
  gitApi: typeof authenticatedGitApi;
  signOut: () => void;
  refreshAuthState: () => void;
} {
  const [authState, setAuthState] = useState<GitAuthState>(() => {
    const isDevelopmentMode = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    
    return {
      isAuthenticated: isDevelopmentMode || authenticatedGitApi.isAuthenticated(),
      user: isDevelopmentMode 
        ? { id: 'dev-user', email: 'dev@plotweaver.local' }
        : authenticatedGitApi.getCurrentUser(),
      isTokenExpired: isDevelopmentMode ? false : authenticatedGitApi.isTokenExpired(),
      isDevelopmentMode
    };
  });

  const refreshAuthState = () => {
    const isDevelopmentMode = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    
    setAuthState({
      isAuthenticated: isDevelopmentMode || authenticatedGitApi.isAuthenticated(),
      user: isDevelopmentMode 
        ? { id: 'dev-user', email: 'dev@plotweaver.local' }
        : authenticatedGitApi.getCurrentUser(),
      isTokenExpired: isDevelopmentMode ? false : authenticatedGitApi.isTokenExpired(),
      isDevelopmentMode
    });
  };

  useEffect(() => {
    // Set up auth state change listener (only in production mode)
    if (!authState.isDevelopmentMode) {
      const unsubscribe = authenticatedGitApi.onAuthStateChange(() => {
        refreshAuthState();
      });

      return unsubscribe;
    }
  }, [authState.isDevelopmentMode]);

  const signOut = () => {
    if (!authState.isDevelopmentMode) {
      authenticatedGitApi.signOut();
      refreshAuthState();
    }
  };

  return {
    ...authState,
    gitApi: authenticatedGitApi,
    signOut,
    refreshAuthState
  };
}