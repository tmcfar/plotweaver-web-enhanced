'use client';

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs';
import React from 'react';

export function ConditionalClerkProvider({ children }: { children: React.ReactNode }) {
  // Only use Clerk if it's configured
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <BaseClerkProvider>{children}</BaseClerkProvider>;
  }

  // In development without Clerk, just render children
  return <>{children}</>;
}
