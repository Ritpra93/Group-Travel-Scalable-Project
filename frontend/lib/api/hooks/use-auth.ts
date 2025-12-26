/**
 * Authentication Hooks using TanStack Query
 * Provides React hooks for auth operations with automatic caching and state management
 */

'use client';

import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api/services/auth.service';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/types/api.types';
import type { User } from '@/types/models.types';
import type { ApiError } from '@/types/api.types';

// ============================================================================
// Query Keys
// ============================================================================

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

// ============================================================================
// useAuthUser - Get current authenticated user
// ============================================================================

export function useAuthUser(): UseQueryResult<User, ApiError> {
  const { isAuthenticated, setUser, clearAuth } = useAuthStore();

  return useQuery<User, ApiError>({
    queryKey: authKeys.me(),
    queryFn: authService.me,
    enabled: isAuthenticated, // Only fetch if user is authenticated
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry if unauthorized
    onSuccess: (data) => {
      // Update auth store with fresh user data
      setUser(data);
    },
    onError: (error) => {
      // If unauthorized, clear auth
      if (error.code === 'UNAUTHORIZED') {
        clearAuth();
      }
    },
  });
}

// ============================================================================
// useLogin - Login mutation
// ============================================================================

export function useLogin(): UseMutationResult<AuthResponse, ApiError, LoginRequest> {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setTokens } = useAuthStore();

  return useMutation<AuthResponse, ApiError, LoginRequest>({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Store user and tokens
      setUser(data.user);
      setTokens(data.accessToken);

      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: authKeys.me() });

      // Redirect to dashboard
      router.push('/dashboard');
    },
  });
}

// ============================================================================
// useRegister - Register mutation
// ============================================================================

export function useRegister(): UseMutationResult<AuthResponse, ApiError, RegisterRequest> {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, setTokens } = useAuthStore();

  return useMutation<AuthResponse, ApiError, RegisterRequest>({
    mutationFn: authService.register,
    onSuccess: (data) => {
      // Store user and tokens
      setUser(data.user);
      setTokens(data.accessToken);

      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: authKeys.me() });

      // Redirect to dashboard
      router.push('/dashboard');
    },
  });
}

// ============================================================================
// useLogout - Logout mutation
// ============================================================================

export function useLogout(): UseMutationResult<void, ApiError, void> {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation<void, ApiError, void>({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear auth state
      clearAuth();

      // Clear all queries
      queryClient.clear();

      // Redirect to login
      router.push('/login');
    },
    onError: () => {
      // Even if logout fails on backend, clear local state
      clearAuth();
      queryClient.clear();
      router.push('/login');
    },
  });
}

// ============================================================================
// useRefreshToken - Manually refresh access token
// ============================================================================

export function useRefreshToken(): UseMutationResult<AuthResponse, ApiError, void> {
  const { setTokens } = useAuthStore();

  return useMutation<AuthResponse, ApiError, void>({
    mutationFn: authService.refresh,
    onSuccess: (data) => {
      // Update access token
      setTokens(data.accessToken);
    },
  });
}
