'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const REDIRECT_URI = process.env.NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT || 'http://localhost:3000/(auth)/github/callback';

export default function GitHubCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const handleCallback = useCallback(async (code: string) => {
    try {
      // Development mode: Skip actual GitHub connection
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Skipping GitHub OAuth, code:', code);
        toast.info('GitHub OAuth not configured in development');
        router.push('/dashboard?dev=true');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/oauth/github/callback`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          redirect_uri: REDIRECT_URI,
          state 
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('GitHub OAuth failed:', response.status, errorData);
        throw new Error('Failed to connect GitHub');
      }

      const data = await response.json();
      
      // Store tokens in localStorage
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      toast.success('GitHub connected successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('GitHub connection failed:', error);
      toast.error('Failed to connect GitHub');
      router.push('/profile?tab=github&error=connection_failed');
    }
  }, [router, state]);

  useEffect(() => {
    if (code) {
      handleCallback(code);
    }
  }, [code, handleCallback]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Connecting to GitHub...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
