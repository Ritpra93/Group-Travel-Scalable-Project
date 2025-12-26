/**
 * Auth Guard Component
 * Client-side route protection - redirects to login if not authenticated
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait for hydration
    if (isLoading) return;

    // Protected routes
    const protectedRoutes = ['/dashboard', '/groups', '/trips', '/invitations', '/settings', '/profile'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // Auth routes (login, register)
    const authRoutes = ['/login', '/register'];
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute && !isAuthenticated) {
      // Redirect to login if trying to access protected route without auth
      router.push('/login');
    } else if (isAuthRoute && isAuthenticated) {
      // Redirect to dashboard if trying to access auth pages while authenticated
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading state during hydration
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
