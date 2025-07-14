import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT: process.env.NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
  
  return NextResponse.json({ 
    message: 'Environment variables',
    env: envVars,
    timestamp: new Date().toISOString()
  });
}