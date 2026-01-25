/**
 * Auth Guard Component
 * Client-side route protection - redirects to login if not authenticated
 * Waits for Zustand hydration to complete before checking auth state
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    if (!_hasHydrated) {
      return;
    }

    // Protected routes - require authentication
    const protectedRoutes = ['/dashboard', '/groups', '/trips', '/invitations', '/settings', '/profile'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // Auth routes (login, register) - redirect to dashboard if already authenticated
    const authRoutes = ['/login', '/register'];
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute && !isAuthenticated) {
      // Redirect to login if trying to access protected route without auth
      router.replace('/login');
    } else if (isAuthRoute && isAuthenticated) {
      // Redirect to dashboard if trying to access auth pages while authenticated
      router.replace('/dashboard');
    } else {
      // Auth check complete, allow rendering
      setIsChecking(false);
    }
  }, [isAuthenticated, _hasHydrated, pathname, router]);

  // Show loading state while checking hydration and auth
  if (!_hasHydrated || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="auth-loading">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
