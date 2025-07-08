'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function GitHubCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    if (code) {
      handleCallback(code);
    }
  }, [code]);

  const handleCallback = async (code: string) => {
    try {
      // Development mode: Skip actual GitHub connection
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Skipping GitHub OAuth, code:', code);
        toast.info('GitHub OAuth not configured in development');
        router.push('/profile?tab=github&dev=true');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/users/github/connect`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('GitHub connect failed:', response.status, errorData);
        throw new Error('Failed to connect GitHub');
      }

      toast.success('GitHub connected successfully!');
      router.push('/profile?tab=github');
    } catch (error) {
      console.error('GitHub connection failed:', error);
      toast.error('Failed to connect GitHub');
      router.push('/profile?tab=github&error=connection_failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Connecting to GitHub...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
