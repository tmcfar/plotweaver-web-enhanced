// Development middleware - bypasses authentication for local testing
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // In development, bypass all authentication
  const response = NextResponse.next()
  
  // Set development user headers for testing
  response.headers.set('x-user-id', '1')
  response.headers.set('x-user-email', 'dev@plotweaver.local')
  
  return response
}

export const config = {
  matcher: [
    // Skip all API routes, static files, and _next
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}