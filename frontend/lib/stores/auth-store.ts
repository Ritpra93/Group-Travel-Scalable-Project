/**
 * Zustand Auth Store
 * Manages authentication state: user, tokens, and auth status
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { setAccessToken } from '@/lib/api/client';
import type { User } from '@/types/models.types';

// ============================================================================
// Auth Store State & Actions
// ============================================================================

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

// ============================================================================
// Create Auth Store with Persistence
// ============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      // Set user
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      // Set tokens and update axios client
      setTokens: (accessToken) => {
        setAccessToken(accessToken); // Update axios client
        set({ accessToken });
      },

      // Clear all auth data (logout)
      clearAuth: () => {
        setAccessToken(null); // Clear token in axios client
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // Set loading state
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'wanderlust-auth', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore access token to axios client after hydration
        if (state?.accessToken) {
          setAccessToken(state.accessToken);
        }
        // Set loading to false after rehydration
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
