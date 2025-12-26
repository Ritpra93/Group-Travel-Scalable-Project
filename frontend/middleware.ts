/**
 * Next.js Middleware
 * Protects authenticated routes and redirects based on auth status
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/groups', '/trips', '/invitations', '/settings', '/profile'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user has access token in localStorage (client-side check)
  // For server-side, we'd check for httpOnly cookie, but Next.js middleware
  // can't easily access localStorage, so we'll handle this on the client

  // For now, let the client-side handle redirects
  // This is a placeholder for future server-side auth checks

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
