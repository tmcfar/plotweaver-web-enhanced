// Development middleware - bypasses authentication for local testing
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // In development, bypass all authentication
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    // Set a dummy user session
    const response = NextResponse.next()
    response.headers.set('x-user-id', '1')
    response.headers.set('x-user-email', 'dev@plotweaver.local')
    return response
  }

  // If Clerk is configured, use the original middleware
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const { clerkMiddleware, createRouteMatcher } = require('@clerk/nextjs/server')
      
      const isProtectedRoute = createRouteMatcher([
        '/dashboard(.*)',
        '/projects(.*)',
        '/settings(.*)',
      ])

      return clerkMiddleware((auth: any, req: NextRequest) => {
        if (isProtectedRoute(req)) auth().protect()
      })(request)
    } catch (error) {
      // If Clerk import fails, just pass through
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}