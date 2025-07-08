'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function GitHubCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const handleCallback = useCallback(async (code: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/github/connect`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect GitHub');
      }

      toast.success('GitHub connected successfully!');
      router.push('/profile?tab=github');
    } catch (error) {
      console.error('GitHub connection failed:', error);
      toast.error('Failed to connect GitHub');
      router.push('/profile?tab=github&error=connection_failed');
    }
  }, [router]);

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
