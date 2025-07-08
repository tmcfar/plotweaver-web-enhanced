'use client';

import { redirect } from 'next/navigation';

export default function SignUpPage() {
  const isDevelopment = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (isDevelopment) {
    // In development without Clerk, redirect to dashboard
    redirect('/dashboard');
  }
  
  // Only render SignUp if Clerk is available
  try {
    const { SignUp } = require('@clerk/nextjs');
    
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md">
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                card: 'bg-card border border-border shadow-lg',
              },
            }}
          />
        </div>
      </div>
    )
  } catch (error) {
    // Clerk not available, redirect to dashboard
    redirect('/dashboard');
  }
}
