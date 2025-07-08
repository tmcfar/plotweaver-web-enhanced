'use client';

import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/design-system/theme-toggle';
import { ProjectSelector } from '@/components/projects/ProjectSelector';
import { User } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // In development without Clerk, we'll use a simple layout
  const isDevelopment = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-8">
            <Logo size="md" />
            <ProjectSelector />
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {isDevelopment ? (
              <Link 
                href="/profile" 
                className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300"
              >
                <User className="h-5 w-5" />
              </Link>
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200" />
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
